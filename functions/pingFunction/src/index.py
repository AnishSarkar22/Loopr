import asyncio
import aiohttp
import json
import time
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query

# Environment variables
APPWRITE_API_KEY = ''  # Your API key
APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1'
DATABASE_ID = ''  # Your database ID
URLS_COLLECTION_ID = ''  # Your URLs collection ID
RESULTS_COLLECTION_ID = ''  # Your results collection ID
NODE_ID = ''  # This node's ID
SHARD_KEY = 0  # This node's shard key (0-9)
MAX_CONCURRENT_REQUESTS = 1000  # Adjust based on available resources

async def ping_url(session, url, url_id):
    start_time = time.time()
    try:
        async with session.get(url, timeout=10) as response:
            end_time = time.time()
            return {
                "url": url,
                "urlId": url_id,
                "status": response.status,
                "success": response.status < 400,
                "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
                "responseTime": round((end_time - start_time) * 1000)
            }
    except Exception as e:
        end_time = time.time()
        return {
            "url": url,
            "urlId": url_id,
            "status": 0,
            "success": False,
            "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
            "responseTime": round((end_time - start_time) * 1000),
            "error": str(e)
        }

async def process_urls():
    # Initialize Appwrite client
    client = Client()
    client.set_endpoint(APPWRITE_ENDPOINT).set_key(APPWRITE_API_KEY).set_project('your-project-id')
    database = Databases(client)
    
    # Get URLs due for pinging
    now = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
    urls_due = database.list_documents(
        DATABASE_ID,
        URLS_COLLECTION_ID,
        queries=[
            Query.equal('nodeId', NODE_ID),
            Query.equal('isEnabled', True),
            Query.equal('shardKey', SHARD_KEY),
            Query.less_than_equal('nextPingTime', now)
        ],
        limit=1000
    )
    
    if not urls_due['documents']:
        print("No URLs due for pinging")
        return
        
    # Prepare URL documents map for quick reference
    url_docs_map = {doc['$id']: doc for doc in urls_due['documents']}
    
    # Create TCP connector with large limit and DNS cache
    connector = aiohttp.TCPConnector(
        limit=MAX_CONCURRENT_REQUESTS, 
        ttl_dns_cache=300,
        use_dns_cache=True
    )
    
    # Process URLs in batches to keep memory usage reasonable
    results_by_user = {}
    update_operations = []
    
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [ping_url(session, doc['url'], doc['$id']) for doc in urls_due['documents']]
        results = await asyncio.gather(*tasks)
        
        # Process results
        for result in results:
            url_id = result['urlId']
            url_doc = url_docs_map.get(url_id)
            if not url_doc:
                continue
                
            # Group results by user for efficient storage
            user_id = url_doc['userId']
            if user_id not in results_by_user:
                results_by_user[user_id] = []
            results_by_user[user_id].append(result)
            
            # Prepare URL document update
            ping_interval = url_doc.get('pingInterval', 15)
            next_ping_time = time.gmtime(time.time() + ping_interval * 60)
            
            # Create update operation
            update_doc = {
                'lastPingTime': result['timestamp'],
                'lastPingStatus': 'success' if result['success'] else 'error',
                'lastPingStatusCode': result['status'],
                'nextPingTime': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', next_ping_time),
                'successCount': url_doc.get('successCount', 0) + (1 if result['success'] else 0)
            }
            
            update_operations.append((url_id, update_doc))
    
    # Store results by user
    for user_id, results in results_by_user.items():
        try:
            today = time.strftime('%Y-%m-%d', time.gmtime())
            shard_id = f"{user_id}_{today}"
            
            try:
                # Try to get existing shard
                existing_shard = database.get_document(
                    DATABASE_ID,
                    RESULTS_COLLECTION_ID,
                    shard_id
                )
                
                # Update existing shard
                updated_results = existing_shard.get('results', [])
                for result in results:
                    existing_idx = next((i for i, r in enumerate(updated_results) 
                                        if r['urlId'] == result['urlId']), -1)
                    if existing_idx >= 0:
                        updated_results[existing_idx]['timestamps'].append(result['timestamp'])
                        updated_results[existing_idx]['statuses'].append(result['status'])
                    else:
                        updated_results.append({
                            'urlId': result['urlId'],
                            'timestamps': [result['timestamp']],
                            'statuses': [result['status']]
                        })
                
                database.update_document(
                    DATABASE_ID,
                    RESULTS_COLLECTION_ID,
                    shard_id,
                    {'results': updated_results}
                )
                
            except Exception:
                # Create new shard
                new_results = []
                for result in results:
                    new_results.append({
                        'urlId': result['urlId'],
                        'timestamps': [result['timestamp']],
                        'statuses': [result['status']]
                    })
                
                database.create_document(
                    DATABASE_ID,
                    RESULTS_COLLECTION_ID,
                    shard_id,
                    {
                        'userId': user_id,
                        'date': today,
                        'shardId': shard_id,
                        'results': new_results
                    }
                )
        except Exception as e:
            print(f"Error storing results for user {user_id}: {str(e)}")
    
    # Update URL documents in batches
    batch_size = 25
    for i in range(0, len(update_operations), batch_size):
        batch = update_operations[i:i+batch_size]
        update_tasks = []
        for url_id, update_doc in batch:
            task = database.update_document(
                DATABASE_ID,
                URLS_COLLECTION_ID,
                url_id,
                update_doc
            )
            update_tasks.append(task)
        
        # Execute batch of updates
        try:
            await asyncio.gather(*update_tasks)
        except Exception as e:
            print(f"Error updating URL documents: {str(e)}")

def main(req, res):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(process_urls())
    
    return res.json({
        "success": True,
        "message": "URLs processed successfully",
        "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
    })