import networkx as nx
from datetime import datetime
from typing import List, Dict, Any, Tuple
from app.schemas import TransactionHop, MuleTrail

def analyze_mule_transaction_graph(complaint_id: str, stolen_amount: float, raw_transactions: List[Dict[str, Any]]) -> MuleTrail:
    """
    Constructs a Directed Graph (DiGraph) of the illicit money flow.
    Traces multi-hop laundering pathways:
    Victim -> Layer 1 Mule (Split) -> Layer 2 Mule -> Terminal Cashout Mule
    """
    G = nx.DiGraph()

    hops: List[TransactionHop] = []
    
    # Populate the directed graph with transaction edges
    for tx in raw_transactions:
        G.add_edge(
            tx["from_account"],
            tx["to_account"],
            amount=tx["amount"],
            bank=tx["bank_name"],
            beneficiary=tx["beneficiary_name"],
            timestamp=tx["timestamp"]
        )
        
        hops.append(TransactionHop(
            hop_level=tx.get("hop_level", 1),
            from_account=tx["from_account"],
            to_account=tx["to_account"],
            beneficiary_name=tx["beneficiary_name"],
            bank_name=tx["bank_name"],
            amount_inr=tx["amount"],
            timestamp=tx["timestamp"],
            mule_risk_score=tx.get("risk_score", 85.0),
            is_terminal_cashout_account=tx.get("is_terminal", False)
        ))

    # Find the terminal node (account with in-degree > 0 but out-degree == 0, representing the cashout sink)
    sink_nodes = [node for node in G.nodes() if G.out_degree(node) == 0 and G.in_degree(node) > 0]
    
    terminal_account = sink_nodes[0] if sink_nodes else hops[-1].to_account
    
    # Extract terminal details from the last hop
    terminal_hop = next((h for h in reversed(hops) if h.to_account == terminal_account), hops[-1])
    terminal_hop.is_terminal_cashout_account = True

    # Compute transaction velocity
    # If 3 hops occur in under 15 minutes, velocity is critical (85-99)
    try:
        t_first = datetime.fromisoformat(hops[0].timestamp.replace("Z", ""))
        t_last = datetime.fromisoformat(hops[-1].timestamp.replace("Z", ""))
        duration_minutes = max((t_last - t_first).total_seconds() / 60.0, 1.0)
    except Exception:
        duration_minutes = 8.5

    # High velocity = faster cashout expectation (15-30 min window)
    velocity_score = min(max(100.0 - (duration_minutes * 2.5), 40.0), 98.0)
    estimated_cashout_window = int(max(40.0 - (velocity_score * 0.25), 15))

    # Anchor Geolocation: In real banking, this comes from the Terminal Mule's registered branch / mobile IP
    # For realistic demonstration, we anchor to known cybercrime cash-out hubs in India (e.g., Delhi NCR / Gurugram / Mewat / Jamtara)
    anchor_city = "Delhi NCR (South East District / Badarpur Border)"
    anchor_lat = 28.5085
    anchor_lon = 77.3012

    return MuleTrail(
        complaint_id=complaint_id,
        total_stolen_inr=stolen_amount,
        hops=hops,
        terminal_mule_account=terminal_account,
        terminal_mule_name=terminal_hop.beneficiary_name,
        terminal_bank=terminal_hop.bank_name,
        terminal_branch_city=anchor_city,
        terminal_branch_lat=anchor_lat,
        terminal_branch_lon=anchor_lon,
        transaction_velocity_score=round(velocity_score, 1),
        estimated_cashout_window_minutes=estimated_cashout_window
    )
