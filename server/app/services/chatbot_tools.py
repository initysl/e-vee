import re
import time
from typing import Any, Dict, List, Optional

from app.core.logging_config import log_error, log_info, log_performance, log_warning
from app.embeddings.embed_products import create_embeddings
from app.services.cart_service import add_to_cart, clear_cart, get_cart, remove_from_cart
from app.services.product_service import get_products


def serialize_product(product: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": int(product["id"]),
        "title": product["title"],
        "price": float(product["price"]),
        "description": product["description"],
        "category": product["category"],
        "image": product.get("image", ""),
        "rating": product.get("rating"),
    }


async def _run_tool(name: str, **context: Any) -> float:
    start = time.time()
    log_info("Running chatbot tool", tool=name, **context)
    return start


def _finish_tool(name: str, start: float, **context: Any) -> None:
    duration = time.time() - start
    log_performance(f"chatbot_tool:{name}", duration, **context)


def _finish_tool_error(name: str, start: float, error: Exception, **context: Any) -> None:
    duration = time.time() - start
    log_performance(f"chatbot_tool:{name}", duration, status="failed", **context)
    log_error(error, f"Chatbot tool failed: {name}", **context)


async def cart_query_tool(session_id: str) -> Dict[str, Any]:
    start = await _run_tool("cart_query", session_id=session_id)
    try:
        cart = await get_cart(session_id)
        _finish_tool("cart_query", start, session_id=session_id, item_count=cart["item_count"])
        return cart
    except Exception as exc:
        _finish_tool_error("cart_query", start, exc, session_id=session_id)
        raise


async def clear_cart_tool(session_id: str) -> Dict[str, Any]:
    start = await _run_tool("clear_cart", session_id=session_id)
    try:
        await clear_cart(session_id)
        cart = await get_cart(session_id)
        _finish_tool("clear_cart", start, session_id=session_id)
        return cart
    except Exception as exc:
        _finish_tool_error("clear_cart", start, exc, session_id=session_id)
        raise


async def add_to_cart_tool(
    session_id: str,
    product_ids: List[str],
    quantity: int,
) -> Dict[str, Any]:
    start = await _run_tool("add_to_cart", session_id=session_id, product_ids=",".join(product_ids), quantity=quantity)
    try:
        products = await get_products()
        added_products: List[Dict[str, Any]] = []
        failed_products: List[str] = []

        for product_id in product_ids:
            product = next((item for item in products if str(item["id"]) == str(product_id)), None)
            if not product:
                failed_products.append(str(product_id))
                continue

            try:
                await add_to_cart(session_id, str(product_id), quantity)
                added_products.append(serialize_product(product))
            except ValueError:
                failed_products.append(str(product_id))

        cart = await get_cart(session_id)
        _finish_tool(
            "add_to_cart",
            start,
            session_id=session_id,
            added=len(added_products),
            failed=len(failed_products),
        )
        return {
            "cart": cart,
            "products": added_products,
            "failed_products": failed_products,
        }
    except Exception as exc:
        _finish_tool_error("add_to_cart", start, exc, session_id=session_id)
        raise


async def remove_from_cart_tool(session_id: str, product_ids: List[str]) -> Dict[str, Any]:
    start = await _run_tool("remove_from_cart", session_id=session_id, product_ids=",".join(product_ids))
    try:
        products = await get_products()
        removed_products: List[Dict[str, Any]] = []
        failed_products: List[str] = []

        for product_id in product_ids:
            product = next((item for item in products if str(item["id"]) == str(product_id)), None)
            if not product:
                failed_products.append(str(product_id))
                continue

            try:
                await remove_from_cart(session_id, str(product_id))
                removed_products.append(serialize_product(product))
            except Exception as exc:
                log_warning(
                    "Remove from cart failed inside tool",
                    session_id=session_id,
                    product_id=product_id,
                    error=str(exc),
                )
                failed_products.append(str(product_id))

        cart = await get_cart(session_id)
        _finish_tool(
            "remove_from_cart",
            start,
            session_id=session_id,
            removed=len(removed_products),
            failed=len(failed_products),
        )
        return {
            "cart": cart,
            "products": removed_products,
            "failed_products": failed_products,
        }
    except Exception as exc:
        _finish_tool_error("remove_from_cart", start, exc, session_id=session_id)
        raise


async def checkout_readiness_tool(session_id: str) -> Dict[str, Any]:
    start = await _run_tool("checkout_readiness", session_id=session_id)
    try:
        cart = await get_cart(session_id)
        _finish_tool("checkout_readiness", start, session_id=session_id, item_count=cart["item_count"])
        return cart
    except Exception as exc:
        _finish_tool_error("checkout_readiness", start, exc, session_id=session_id)
        raise


async def product_detail_tool(product_id: Optional[str]) -> Optional[Dict[str, Any]]:
    start = await _run_tool("product_detail", product_id=product_id or "none")
    try:
        if not product_id:
            _finish_tool("product_detail", start, found=False)
            return None

        products = await get_products()
        product = next((item for item in products if str(item["id"]) == str(product_id)), None)
        _finish_tool("product_detail", start, product_id=product_id, found=bool(product))
        return serialize_product(product) if product else None
    except Exception as exc:
        _finish_tool_error("product_detail", start, exc, product_id=product_id or "none")
        raise


async def compare_products_tool(product_ids: List[str]) -> List[Dict[str, Any]]:
    start = await _run_tool("compare_products", product_ids=",".join(product_ids))
    try:
        unique_ids: List[str] = []
        for product_id in product_ids:
            if product_id not in unique_ids:
                unique_ids.append(product_id)

        products = await get_products()
        selected = [
            next((item for item in products if str(item["id"]) == str(product_id)), None)
            for product_id in unique_ids[:2]
        ]
        output = [serialize_product(product) for product in selected if product]
        _finish_tool("compare_products", start, compared=len(output))
        return output
    except Exception as exc:
        _finish_tool_error("compare_products", start, exc, product_ids=",".join(product_ids))
        raise


async def hub_info_tool(collection: Any, topic: str) -> Optional[Dict[str, str]]:
    start = await _run_tool("hub_info", topic=topic)
    try:
        results = collection.get(
            where={
                "$and": [
                    {"type": {"$eq": "hub_info"}},
                    {"topic": {"$eq": topic}},
                ]
            }
        )
        metadatas = results.get("metadatas") if results else None
        metadata = metadatas[0] if metadatas else None
        _finish_tool("hub_info", start, topic=topic, found=bool(metadata))
        if not metadata:
            return None
        return {
            "title": metadata.get("title", topic.title()),
            "answer": metadata.get("answer", "Information not available."),
        }
    except Exception as exc:
        _finish_tool_error("hub_info", start, exc, topic=topic)
        return None


async def search_products_tool(
    collection: Any,
    query: str,
    sort_hint: str,
    session: Dict[str, Any],
    category_synonyms: Dict[str, List[str]],
    stop_words: set[str],
) -> List[Dict[str, Any]]:
    start = await _run_tool("search_products", query=query, sort_hint=sort_hint)
    try:
        products = await get_products()
        if not products:
            _finish_tool("search_products", start, count=0)
            return []

        lowered_query = query.lower().strip()
        if _is_refinement(lowered_query) and session.get("last_results"):
            refined = _refine_previous_results(session.get("last_results", []), lowered_query)
            _finish_tool("search_products", start, count=len(refined), source="session_refinement")
            return refined

        category_filter = _detect_category_filter(lowered_query, category_synonyms)
        max_price = _extract_max_price(lowered_query)
        tokens = [token for token in re.findall(r"[a-z0-9']+", lowered_query) if token not in stop_words]

        scored: List[tuple[float, Dict[str, Any]]] = []
        for product in products:
            title = product["title"].lower()
            description = product["description"].lower()
            category = product["category"].lower()

            if category_filter and category != category_filter:
                continue

            if max_price is not None and float(product["price"]) > max_price:
                continue

            score = 0.0
            for token in tokens:
                if token in title:
                    score += 4
                elif token in category:
                    score += 3
                elif token in description:
                    score += 1

            if category_filter:
                score += 4

            if not tokens and category_filter:
                score += 1

            if "cheap" in lowered_query or "cheaper" in lowered_query or "affordable" in lowered_query:
                score += max(0.0, 50.0 - float(product["price"])) / 50.0

            if score > 0:
                scored.append((score, product))

        ordered = [product for _, product in sorted(scored, key=lambda item: (-item[0], float(item[1]["price"])))]
        if sort_hint == "price_asc":
            ordered = sorted(ordered, key=lambda item: float(item["price"]))

        if len(ordered) < 3:
            ordered = _merge_with_vector_results(collection, ordered, query, products)

        results = [serialize_product(product) for product in ordered[:4]]
        _finish_tool("search_products", start, count=len(results))
        return results
    except Exception as exc:
        _finish_tool_error("search_products", start, exc, query=query)
        raise


def _merge_with_vector_results(
    collection: Any,
    ranked_products: List[Dict[str, Any]],
    query: str,
    all_products: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    ranked_ids = {str(product["id"]) for product in ranked_products}
    merged = list(ranked_products)

    try:
        query_embedding = create_embeddings([query])[0]
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=4,
            where={"type": {"$eq": "product"}},
        )
        for metadata in results.get("metadatas", [[]])[0]:
            product_id = str(metadata.get("product_id"))
            if product_id in ranked_ids:
                continue
            product = next((item for item in all_products if str(item["id"]) == product_id), None)
            if product:
                merged.append(product)
                ranked_ids.add(product_id)
    except Exception as exc:
        log_warning("Vector fallback search failed", error=str(exc))

    return merged


def _refine_previous_results(results: List[Dict[str, Any]], message: str) -> List[Dict[str, Any]]:
    refined = list(results)
    if "cheap" in message or "cheaper" in message or "affordable" in message:
        refined.sort(key=lambda item: float(item["price"]))
    elif "expensive" in message or "premium" in message:
        refined.sort(key=lambda item: float(item["price"]), reverse=True)
    return refined[:4]


def _is_refinement(message: str) -> bool:
    return any(word in message for word in ["cheaper", "cheap", "affordable", "more like", "similar"])


def _detect_category_filter(message: str, category_synonyms: Dict[str, List[str]]) -> Optional[str]:
    for category, keywords in category_synonyms.items():
        for keyword in keywords:
            if re.search(rf"\b{re.escape(keyword)}\b", message):
                return category
    return None


def _extract_max_price(message: str) -> Optional[float]:
    match = re.search(r"(?:under|below|less than|max)\s*\$?(\d+(?:\.\d+)?)", message)
    if match:
        return float(match.group(1))
    return None
