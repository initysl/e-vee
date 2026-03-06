from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ParsedRequest:
    intent: str
    product_ids: List[str] = field(default_factory=list)
    quantity: int = 1
    topic: Optional[str] = None
    query: Optional[str] = None
    sort_hint: str = "relevance"
    reference_indices: List[int] = field(default_factory=list)
