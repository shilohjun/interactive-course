#!/usr/bin/env python3
"""
Translate English cues to Chinese using DeepSeek API.
Usage: python scripts/translate_cues.py <transcript.json> <output.json>
"""
import sys
import json
import os
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    print("Error: openai package not installed. Run: pip install openai")
    sys.exit(1)


def translate_batch(texts: list[str], client: OpenAI) -> list[str]:
    """Translate a batch of English texts to Chinese."""
    if not texts:
        return []
    
    # Join texts with delimiters for batch processing
    batch_text = "\n---\n".join(texts)
    
    prompt = f"""Translate the following English lecture transcript lines to Chinese. 
Each line is separated by '---'. Return ONLY the Chinese translations in the same order, separated by '---'.
Preserve technical terms (like "linear algebra", "matrix", "vector") in their common Chinese mathematical usage.
Keep the tone academic but accessible.

{batch_text}"""
    
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a professional translator specializing in mathematics and computer science education."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )
    
    result = response.choices[0].message.content.strip()
    translations = result.split("\n---\n")
    
    # Ensure we got the right number of translations
    if len(translations) != len(texts):
        print(f"Warning: Expected {len(texts)} translations, got {len(translations)}")
        # Pad with originals if needed
        while len(translations) < len(texts):
            translations.append(texts[len(translations)])
    
    return translations


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input_transcript.json> <output_transcript.json>")
        sys.exit(1)
    
    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    
    if not input_path.exists():
        print(f"Error: {input_path} not found")
        sys.exit(1)
    
    # Check for API key
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        print("Error: DEEPSEEK_API_KEY environment variable not set")
        print("Get your API key from https://platform.deepseek.com/api_keys")
        sys.exit(1)
    
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com"
    )
    
    # Load transcript
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    cues = data.get("cues", [])
    if not cues:
        print("Error: No cues found in transcript")
        sys.exit(1)
    
    print(f"Translating {len(cues)} cues...")
    
    # Translate in batches of 10 to avoid token limits
    batch_size = 10
    for i in range(0, len(cues), batch_size):
        batch = cues[i:i + batch_size]
        texts = [cue["text"] for cue in batch]
        
        print(f"Batch {i // batch_size + 1}/{(len(cues) + batch_size - 1) // batch_size}...", end=" ", flush=True)
        
        try:
            translations = translate_batch(texts, client)
            
            for j, translation in enumerate(translations):
                cues[i + j]["text_zh"] = translation
            
            print("✓")
        except Exception as e:
            print(f"\nError translating batch: {e}")
            # Add empty translations for this batch
            for j in range(len(batch)):
                cues[i + j]["text_zh"] = ""
    
    # Save updated transcript
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nTranslated transcript saved to {output_path}")
    
    # Print sample
    print("\nSample translations:")
    for i, cue in enumerate(cues[:3]):
        print(f"\n[{i+1}] EN: {cue['text']}")
        print(f"    ZH: {cue.get('text_zh', '(missing)')}")


if __name__ == "__main__":
    main()
