import os
from dotenv import load_dotenv
from typing import List, Dict, Any
import numpy as np
from app.services.product_service import get_products
from app.data.shophub_data import SHOPHUB_INFO
from app.embeddings.chroma_client import get_chroma_client
from app.services.product_service import clear_cache
from huggingface_hub import InferenceClient


client = InferenceClient(token=os.getenv("HUGGINGFACEHUB_API_KEY"))

def create_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings using HuggingFace Inference API"""
    embeddings = []

    for text in texts:
        response = client.feature_extraction(
            text=text,
            model="sentence-transformers/all-MiniLM-L6-v2"
        )
        # HuggingFace returns shape (sequence_length, embedding_dim)
        # We need mean pooling to get single vector per text
        if isinstance(response[0], list):
            # Mean pooling across sequence
            embedding = [sum(col)/len(col) for col in zip(*response)]
        else:
            embedding = response
        embeddings.append(embedding)
   
    return embeddings

def create_product_document(product: Dict[str, Any]) -> str:
    """
    Convert product data into a text document for embedding.
    Args:
        product: Product dictionary from API
    Returns:
        str: Formatted text combining product fields
    """
    title = product.get("title", "")
    description = product.get("description", "")
    category = product.get("category", "")
    price = product.get("price", "")
    
    # Combine fields into searchable text
    document = f"Product: {title}. Category: {category}. Description: {description}. Price: ${price}"
    return document

async def embed_and_store_products():
    """Fetch products, create documents, generate embeddings, and store them.
    Also embed SHOPHUB information.
    """
    products = await get_products()
    if not products:
        print("No products found to embed.")
        return
    
    collection = get_chroma_client()

    # Clear existing data to avoid duplicate IDs
    try:
        existing_count = collection.count()
        if existing_count > 0:
            print(f"Clearing {existing_count} existing documents from collection...")
            existing_data = collection.get()
            if existing_data and existing_data['ids']:
                collection.delete(ids=existing_data['ids'])
            print("Collection cleared")
    except Exception as e:
        print(f"Error clearing collection: {e}")

    documents = []
    metadatas = []
    ids = []

    # Process each product into a text document
    for product in products:
        product_id = str(product.get('id'))

        # Create document from product data
        doc_text = create_product_document(product)
        documents.append(doc_text)

        # Store metadata for retrieval
        metadatas.append({
            'type': 'product',
            'product_id': product_id,
            'title': product.get('title', ''),
            'price': str(product.get('price', '')),
            'category': product.get('category', ''),
            'image': product.get('image', ''),
            'description': product.get('description', '')
        })

        ids.append(f"product_{product_id}")

    # Embed SHOPHUB_INFO description
    documents.append(SHOPHUB_INFO['description'])
    metadatas.append({
        'type': 'hub_info',
        'topic': 'description',
        'content_type': 'general'
    })
    ids.append("hub_info_description")

    # Embed each FAQ from the dict structure
    faqs_dict = SHOPHUB_INFO['faqs']
    for topic, faq_data in faqs_dict.items():
        # Create searchable text from FAQ
        faq_text = f"Topic: {topic}. {faq_data['title']}. {faq_data['content']}"
        documents.append(faq_text)

        metadatas.append({
            'type': 'hub_info',
            'topic': topic,
            'title': faq_data['title'],
            'answer': faq_data['content'],  # Store content as answer
            'content_type': 'faq'
        })
        ids.append(f"hub_info_faq_{topic}")

    # Generate embeddings using HuggingFace API
    print(f"Generating embeddings for {len(documents)} documents (products + shophub info)...")
    embeddings = create_embeddings(documents)

    # Store embeddings in ChromaDB
    collection.add(
        embeddings=embeddings, # type: ignore
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    print(f"Successfully embedded and stored {len(products)} products and {len(faqs_dict) + 1} shophub documents in ChromaDB")

async def refresh_embedddings():
    """
    Force refresh products and recreate embeddings.
    """
    clear_cache()

    # Re-embed products and store
    await embed_and_store_products()
    print("Product embeddings refreshed successfully.")