from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import requests
import os
from deep_translator import GoogleTranslator

app = Flask(__name__)
# Enable CORS so the vanilla HTML frontend can make requests
CORS(app)

DB_PATH = 'nexus_reader.db'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        # Ensure tables exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT,
                document_name TEXT
            )
        ''')
        conn.commit()

init_db()

@app.route('/api/meaning', methods=['GET'])
def get_meaning():
    word = request.args.get('word', '').strip()
    if not word:
        return jsonify({'error': 'Word is required'}), 400
    
    try:
        # Using free dictionary API
        response = requests.get(f'https://api.dictionaryapi.dev/api/v2/entries/en/{word}')
        if response.status_code == 200:
            data = response.json()
            meaning = data[0]['meanings'][0]['definitions'][0]['definition']
            return jsonify({'meaning': meaning})
        else:
            return jsonify({'meaning': 'Definition not found.'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/explain', methods=['POST'])
def explain_simply():
    data = request.json
    text = data.get('text', '')
    
    # Mock AI explanation
    explanation = f"Here is a simple explanation of what you highlighted: The concept '{text[:40]}...' fundamentally means that this process helps simplify complex information. (Note: This is a simulated AI response. Connect a real API key for production.)"
    
    return jsonify({'explanation': explanation})

@app.route('/api/translate', methods=['POST'])
def translate():
    data = request.json
    text = data.get('text', '')
    target_lang = data.get('lang', 'es') # Default to spanish
    
    if not text:
        return jsonify({'error': 'Text is required'}), 400

    try:
        translated = GoogleTranslator(source='auto', target=target_lang).translate(text)
        return jsonify({'translation': translated})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wikipedia', methods=['GET'])
def fetch_wikipedia():
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify({'error': 'Query required'}), 400
    
    try:
        # We replace spaces with underscores for wikipedia title
        title = query.replace(' ', '_')
        url = f'https://en.wikipedia.org/api/rest_v1/page/summary/{title}'
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            return jsonify({
                'title': data.get('title'),
                'summary': data.get('extract', 'No summary found.'),
                'url': data.get('content_urls', {}).get('desktop', {}).get('page', '')
            })
        return jsonify({'error': 'Not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
