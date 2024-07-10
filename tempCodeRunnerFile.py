            # # Upload to DynamoDB in parallel
            # with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            #     chunk_size = 100
            #     chunks = [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]
            #     list(executor.map(upload_to_dynamodb, chunks))  # Use list() to ensure all tasks complete