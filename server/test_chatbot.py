import asyncio
from app.embeddings.embed_products import embed_and_store_products
from app.services.chatbot_service import get_chatbot_service
from app.embeddings.chroma_client import get_collection_count
import uuid


async def test_setup():
    """Test embedding and ChromaDB setup"""
    print("=" * 50)
    print("STEP 1: Testing Product Fetching & Embedding")
    print("=" * 50)
    
    try:
        # Embed products and platform info
        await embed_and_store_products()
        
        # Check collection
        count = get_collection_count()
        print(f"\n✓ ChromaDB has {count} documents stored\n")
    except Exception as e:
        print(f"\n✗ Setup failed: {str(e)}\n")
        raise


async def test_chatbot():
    """Test chatbot with various queries"""
    print("=" * 50)
    print("STEP 2: Testing Chatbot Service")
    print("=" * 50)
    
    try:
        chatbot = get_chatbot_service()
        if not chatbot:
            raise ValueError("Chatbot service initialization failed")
        
        session_id = str(uuid.uuid4())
        
        # Test cases
        test_queries = [
            "Hello!",
            "What's your return policy?",
            "Show me some electronics",
            "Tell me about product 5",
            "Add product 5 to cart",
            "What's in my cart?",
            "I want to checkout"
        ]
        
        for query in test_queries:
            print(f"\n🧑 User: {query}")
            try:
                response = await asyncio.wait_for(
                    chatbot.process_message(query, session_id), 
                    timeout=10.0
                )
                if response:
                    print(f"🤖 Bot: {response['response']}")
                    print(f"   Intent: {response['intent']}")
                else:
                    print(f"🤖 Bot: No response received")
            except asyncio.TimeoutError:
                print(f"🤖 Bot: Request timed out")
            except Exception as e:
                print(f"🤖 Bot: Error processing query - {str(e)}")
            print("-" * 50)
    except Exception as e:
        print(f"\n✗ Chatbot test failed: {str(e)}\n")
        raise


async def main():
    """Run all tests"""
    try:
        await test_setup()
        await test_chatbot()
        print("\n✅ All tests completed!")
    except Exception as e:
        print(f"\n❌ Tests failed: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())