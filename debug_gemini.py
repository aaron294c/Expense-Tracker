import os
import sys
sys.path.insert(0, 'agents')

from adapters.gemini import GeminiWorker

# Test a simple API call
worker = GeminiWorker(debug=True)
response = worker.generate("Create a simple test. End with valid JSON control protocol.", 1)
print("\n" + "="*50)
print("GEMINI RESPONSE:")
print("="*50)
print(response)
print("="*50)

# Try to find JSON in the response
import re
json_pattern = r'\{[^{}]*"decision"[^{}]*\}'
matches = re.findall(json_pattern, response, re.DOTALL)
print(f"\nFound {len(matches)} JSON matches:")
for i, match in enumerate(matches):
    print(f"Match {i}: {match}")
