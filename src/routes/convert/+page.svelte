<script>
    import { onMount } from 'svelte';
    
    let jsonInput = '';
    let convertedOutput = '';
    let error = '';
    let success = false;
    let downloading = false;
    
    function convertJsonFormat() {
      try {
        error = '';
        success = false;
        
        // If it's an empty string, don't process
        if (!jsonInput.trim()) {
          error = 'Please paste some JSON data';
          return;
        }
        
        // Try to parse as a single object first
        try {
          const singleObj = JSON.parse(jsonInput);
          
          // If it's an array already, just format it
          if (Array.isArray(singleObj)) {
            convertedOutput = JSON.stringify(singleObj, null, 2);
            success = true;
            return;
          }
          
          // If it's an object, wrap it in an array
          convertedOutput = JSON.stringify([singleObj], null, 2);
          success = true;
          return;
        } catch (e) {
          // Not valid JSON, continue with other approaches
        }
        
        // Try to handle format from the example (with outer curly braces)
        if (jsonInput.trim().startsWith('{') && jsonInput.trim().endsWith('}')) {
          try {
            // Wrap in array brackets
            const arrayJson = `[${jsonInput}]`;
            const parsed = JSON.parse(arrayJson);
            convertedOutput = JSON.stringify(parsed, null, 2);
            success = true;
            return;
          } catch (e) {
            error = 'Failed to parse as a JSON object: ' + e.message;
            return;
          }
        }
        
        // Try to handle a comma-separated list of objects
        if (jsonInput.trim().startsWith('{') && jsonInput.includes('},{')) {
          try {
            // Wrap in array brackets
            const arrayJson = `[${jsonInput}]`;
            const parsed = JSON.parse(arrayJson);
            convertedOutput = JSON.stringify(parsed, null, 2);
            success = true;
            return;
          } catch (e) {
            error = 'Failed to parse as a list of objects: ' + e.message;
            return;
          }
        }
        
        error = 'Could not determine a valid JSON format. Please check your input.';
      } catch (e) {
        error = 'Error converting JSON: ' + e.message;
      }
    }
    
    function downloadJson() {
      if (!convertedOutput) return;
      
      downloading = true;
      
      try {
        const blob = new Blob([convertedOutput], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'letterboxd_movies.json';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (e) {
        error = 'Error downloading file: ' + e.message;
      } finally {
        downloading = false;
      }
    }
    
    function saveToServer() {
      // This would normally post to a server endpoint
      // For now, just download the file and instruct to place in static/
      downloadJson();
    }
  </script>
  
  <svelte:head>
    <title>Convert JSON Format</title>
  </svelte:head>
  
  <div class="container">
    <h1>Convert Letterboxd JSON Format</h1>
    
    <div class="instructions">
      <p>Use this tool to convert your Letterboxd movie data to the correct JSON format for the review selector.</p>
      <ol>
        <li>Paste your JSON data in the input box below</li>
        <li>Click "Convert Format" to process the data</li>
        <li>Review the converted output</li>
        <li>Click "Download JSON" to save the file</li>
        <li>Place the downloaded file in the <code>static/</code> folder as <code>letterboxd_movies.json</code></li>
      </ol>
    </div>
    
    <div class="converter">
      <div class="input-section">
        <h2>Input JSON</h2>
        <textarea 
          bind:value={jsonInput} 
          placeholder="Paste your Letterboxd JSON data here..."
          rows="15"
        ></textarea>
        <button class="convert-btn" on:click={convertJsonFormat}>Convert Format</button>
      </div>
      
      <div class="output-section">
        <h2>Converted Output</h2>
        <textarea 
          bind:value={convertedOutput} 
          placeholder="Converted JSON will appear here..."
          rows="15"
          readonly
        ></textarea>
        <div class="output-actions">
          <button class="download-btn" on:click={downloadJson} disabled={!success || downloading}>
            {downloading ? 'Downloading...' : 'Download JSON'}
          </button>
        </div>
      </div>
    </div>
    
    {#if error}
      <div class="error-message">
        <p>{error}</p>
      </div>
    {/if}
    
    {#if success}
      <div class="success-message">
        <p>✓ Successfully converted JSON format!</p>
        <p class="note">Download the file and place it in your project's <code>static/</code> folder as <code>letterboxd_movies.json</code></p>
      </div>
    {/if}
    
    <div class="navigation">
      <a href="/" class="nav-button">Back to Home</a>
    </div>
  </div>
  
  <style>
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    h1 {
      margin-bottom: 1.5rem;
    }
    
    .instructions {
      margin-bottom: 2rem;
      background-color: #f5f5f5;
      padding: 1.5rem;
      border-radius: 5px;
    }
    
    .instructions code {
      background-color: #e0e0e0;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: monospace;
    }
    
    .converter {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    textarea {
      width: 100%;
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-family: monospace;
      resize: vertical;
    }
    
    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      cursor: pointer;
      font-weight: bold;
      margin-top: 1rem;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .convert-btn {
      background-color: #4CAF50;
      color: white;
    }
    
    .download-btn {
      background-color: #2196F3;
      color: white;
    }
    
    .error-message {
      background-color: #ffebee;
      color: #c62828;
      padding: 1rem;
      border-radius: 5px;
      margin-bottom: 1.5rem;
    }
    
    .success-message {
      background-color: #e8f5e9;
      color: #2e7d32;
      padding: 1rem;
      border-radius: 5px;
      margin-bottom: 1.5rem;
    }
    
    .note {
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }
    
    .navigation {
      margin-top: 2rem;
    }
    
    .nav-button {
      display: inline-block;
      padding: 0.5rem 1rem;
      background-color: #333;
      color: white;
      text-decoration: none;
      border-radius: 5px;
    }
    
    @media (max-width: 768px) {
      .converter {
        grid-template-columns: 1fr;
      }
    }
  </style>