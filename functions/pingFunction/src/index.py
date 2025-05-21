import json
import time
from appwrite.client import Client
from appwrite.services.databases import Databases
import requests

"""
  'req' variable has:
    'headers' - object with request headers
    'payload' - request body data as a string
    'variables' - object with function variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200
  
  If an error is thrown, a response with code 500 will be returned.
"""

def main(req, res):
    # Get variables and payload
    variables = req.variables
    DATABASE_ID = variables.get('DATABASE_ID')
    COLLECTION_ID = variables.get('COLLECTION_ID')
    API_KEY = variables.get('API_KEY')
    
    try:
        payload = json.loads(req.payload)
        url_id = payload.get('urlId')
    except:
        return res.json({'success': False, 'message': 'Invalid payload'}, 400)
    
    # Initialize Appwrite SDK
    client = Client()
    client.set_endpoint('https://cloud.appwrite.io/v1') \
          .set_project(variables.get('APPWRITE_FUNCTION_PROJECT_ID')) \
          .set_key(API_KEY)
    
    database = Databases(client)
    
    try:
        # Get URL info
        url_doc = database.get_document(DATABASE_ID, COLLECTION_ID, url_id)
        
        if not url_doc or not url_doc.get('isEnabled', False):
            return res.json({'success': False, 'message': 'URL not enabled or not found'})
        
        # Perform the ping
        start_time = time.time()
        ping_result = {}
        
        try:
            response = requests.get(
                url_doc.get('url'),
                headers={'User-Agent': 'Keep-Render-Alive/1.0'},
                timeout=10  # 10 seconds timeout
            )
            
            end_time = time.time()
            response_time = int((end_time - start_time) * 1000)  # convert to milliseconds
            
            ping_result = {
                'status': response.status_code,
                'success': 200 <= response.status_code < 400,
                'responseTime': response_time,
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
            }
        except Exception as ping_error:
            ping_result = {
                'status': 0,
                'success': False,
                'error': str(ping_error),
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
            }
        
        # Update URL document with ping results
        last_ping_time = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
        last_ping_status = 'success' if ping_result.get('success') else 'error'
        last_ping_status_code = ping_result.get('status')
        
        # Update success count
        success_count = url_doc.get('successCount', 0)
        if ping_result.get('success'):
            success_count += 1
        
        # Create a new log entry
        new_log = {
            'timestamp': ping_result.get('timestamp'),
            'message': (
                f"Ping successful ({ping_result.get('status')}) - {ping_result.get('responseTime')}ms" 
                if ping_result.get('success') 
                else f"Ping failed: {ping_result.get('error', f'HTTP {ping_result.get('status')}')}"
            ),
            'type': 'success' if ping_result.get('success') else 'error'
        }
        
        # Add the new log to the logs array, keeping only the last 100
        logs = url_doc.get('logs', [])
        logs.append(new_log)
        logs = logs[-100:]  # Keep only last 100 logs
        
        # Update the document
        database.update_document(
            DATABASE_ID, 
            COLLECTION_ID, 
            url_id, 
            {
                'lastPingTime': last_ping_time,
                'lastPingStatus': last_ping_status,
                'lastPingStatusCode': last_ping_status_code,
                'successCount': success_count,
                'logs': logs
            }
        )
        
        return res.json({
            'success': True,
            'pingResult': ping_result,
            'urlId': url_id
        })
        
    except Exception as error:
        print(f'Error in ping function: {error}')
        return res.json({
            'success': False,
            'error': str(error),
            'urlId': url_id if 'url_id' in locals() else None
        }, 500)