<!-- routes\game-settings\+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    
    type InfoType = "year" | "genre" | "actor" | "director" | "allGenres" | "rating";
    
    interface InfoConfig {
        id: string;
        type: InfoType;
        position?: number;
        description: string;
    }
    
    interface PhaseConfig {
        phase: number;
        title: string;
        infoTypes: string[]; // IDs of the InfoConfig items
    }
    
    // Available info types
    const availableInfoTypes: InfoConfig[] = [
        { id: "year", type: "year", description: "Release Year" },
        { id: "firstGenre", type: "genre", description: "First Genre" },
        { id: "thirdActor", type: "actor", position: 3, description: "Third-billed Actor" },
        { id: "director", type: "director", description: "Director" },
        { id: "secondActor", type: "actor", position: 2, description: "Second-billed Actor" },
        { id: "allGenres", type: "allGenres", description: "All Genres" },
        { id: "firstActor", type: "actor", position: 1, description: "First-billed Actor" },
        { id: "rating", type: "rating", description: "Letterboxd Rating" }
    ];
    
    // Default phase configurations
    const defaultPhaseConfig: PhaseConfig[] = [
        { 
            phase: 1, 
            title: "Starting Phase", 
            infoTypes: ["year"] 
        },
        { 
            phase: 2, 
            title: "Second Phase", 
            infoTypes: ["firstGenre"] 
        },
        { 
            phase: 3, 
            title: "Third Phase", 
            infoTypes: ["thirdActor"] 
        },
        { 
            phase: 4, 
            title: "Fourth Phase", 
            infoTypes: ["director"] 
        },
        { 
            phase: 5, 
            title: "Fifth Phase", 
            infoTypes: ["secondActor", "allGenres"] 
        },
        { 
            phase: 6, 
            title: "Final Phase", 
            infoTypes: ["firstActor", "rating"] 
        }
    ];
    
    // Phase configurations the player can modify
    let phaseConfigs: PhaseConfig[] = [...defaultPhaseConfig];
    let activePhaseIndex = 0;
    
    // For backwards compatibility with old settings format
    let legacyInfoOrder: InfoConfig[] = [...availableInfoTypes];
    let settingsMode: 'phases' | 'legacy' = 'phases';
    
    // UI state variables
    let saved = false;
    let showConfirmReset = false;
    
    onMount(() => {
        try {
            // Try to load phase configuration first
            const savedPhaseConfig = localStorage.getItem('gamePhaseConfig');
            if (savedPhaseConfig) {
                phaseConfigs = JSON.parse(savedPhaseConfig);
                settingsMode = 'phases';
                return;
            }
            
            // Fall back to legacy format if no phase config exists
            const savedOrder = localStorage.getItem('gameInfoOrder');
            if (savedOrder) {
                legacyInfoOrder = JSON.parse(savedOrder);
                settingsMode = 'legacy';
                
                // Convert legacy format to new phase format
                generatePhaseConfigFromLegacy();
            }
        } catch (error) {
            console.error('Error loading saved settings:', error);
        }
    });
    
    function saveSettings() {
        try {
            if (settingsMode === 'phases') {
                localStorage.setItem('gamePhaseConfig', JSON.stringify(phaseConfigs));
                
                // Also save in legacy format for backwards compatibility
                const legacyOrder = generateLegacyOrderFromPhases();
                localStorage.setItem('gameInfoOrder', JSON.stringify(legacyOrder));
            } else {
                localStorage.setItem('gameInfoOrder', JSON.stringify(legacyInfoOrder));
                
                // Also update phase config
                generatePhaseConfigFromLegacy();
                localStorage.setItem('gamePhaseConfig', JSON.stringify(phaseConfigs));
            }
            
            saved = true;
            setTimeout(() => saved = false, 2000);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    function resetToDefaults() {
        if (settingsMode === 'phases') {
            phaseConfigs = [...defaultPhaseConfig];
        } else {
            legacyInfoOrder = [...availableInfoTypes].sort((a, b) => {
                const defaultA = defaultPhaseConfig.findIndex(p => p.infoTypes.includes(a.id));
                const defaultB = defaultPhaseConfig.findIndex(p => p.infoTypes.includes(b.id));
                return defaultA - defaultB;
            });
        }
        saveSettings();
        showConfirmReset = false;
    }
    
    function toggleInfoInPhase(phaseIndex: number, infoId: string) {
        const phase = phaseConfigs[phaseIndex];
        const infoIndex = phase.infoTypes.indexOf(infoId);
        
        if (infoIndex === -1) {
            // Add info to this phase
            phase.infoTypes.push(infoId);
        } else {
            // Remove info from this phase
            phase.infoTypes.splice(infoIndex, 1);
        }
        
        // Update the phase configs to trigger reactivity
        phaseConfigs = [...phaseConfigs];
    }
    
    function isInfoUsed(infoId: string): boolean {
        return phaseConfigs.some(phase => phase.infoTypes.includes(infoId));
    }
    
    function isInfoAvailableForPhase(phaseIndex: number, infoId: string): boolean {
        // Check if info is used in an earlier phase
        for (let i = 0; i < phaseIndex; i++) {
            if (phaseConfigs[i].infoTypes.includes(infoId)) {
                return false;
            }
        }
        return true;
    }
    
    function generatePhaseConfigFromLegacy() {
        // Create phases based on legacy order
        phaseConfigs = defaultPhaseConfig.map(phase => ({
            ...phase,
            infoTypes: []
        }));
        
        // Assign each info to a phase based on its position in the legacy order
        legacyInfoOrder.forEach((info, index) => {
            const phaseIndex = Math.min(Math.floor(index / 2), 5); // Distribute items in phases (up to 2 per phase)
            phaseConfigs[phaseIndex].infoTypes.push(info.id);
        });
    }
    
    function generateLegacyOrderFromPhases(): InfoConfig[] {
        const result: InfoConfig[] = [];
        
        // Flatten phase configs into a single ordered list
        phaseConfigs.forEach(phase => {
            phase.infoTypes.forEach(infoId => {
                const info = availableInfoTypes.find(i => i.id === infoId);
                if (info) {
                    result.push(info);
                }
            });
        });
        
        // Add any unused info types at the end (shouldn't happen but just in case)
        availableInfoTypes.forEach(info => {
            if (!result.some(i => i.id === info.id)) {
                result.push(info);
            }
        });
        
        return result;
    }
    
    function setActivePhase(index: number) {
        activePhaseIndex = index;
    }
    
    function isInfoInPhase(phaseIndex: number, infoId: string): boolean {
        return phaseConfigs[phaseIndex].infoTypes.includes(infoId);
    }
    
    // Find any unused info types
    $: unusedInfoTypes = availableInfoTypes.filter(info => 
        !phaseConfigs.some(phase => phase.infoTypes.includes(info.id))
    );
    
    // Check if any item is used in multiple phases (which is invalid)
    $: duplicateInfoItems = availableInfoTypes.filter(info => 
        phaseConfigs.filter(phase => phase.infoTypes.includes(info.id)).length > 1
    );
    
    // Helper to get info config by ID
    function getInfoById(id: string): InfoConfig | undefined {
        return availableInfoTypes.find(info => info.id === id);
    }
</script>

<svelte:head>
    <title>Game Settings</title>
</svelte:head>

<div class="container">
    <h1>Game Settings</h1>
    
    <div class="card">
        <div class="card-header">
            <h2>Game Progression Settings</h2>
            <p>Configure which information is revealed during each phase of the game.</p>
            
            <div class="tabs">
                <button 
                    class={settingsMode === 'phases' ? 'active' : ''} 
                    on:click={() => settingsMode = 'phases'}
                >
                    Phase Configuration
                </button>
                <button 
                    class={settingsMode === 'legacy' ? 'active' : ''} 
                    on:click={() => settingsMode = 'legacy'}
                >
                    Legacy Order Mode
                </button>
            </div>
        </div>
        
        {#if settingsMode === 'phases'}
            <div class="phase-configuration" in:fade={{ duration: 200 }}>
                <div class="phase-tabs">
                    {#each phaseConfigs as phase, index}
                        <button 
                            class="phase-tab {activePhaseIndex === index ? 'active' : ''}" 
                            on:click={() => setActivePhase(index)}
                        >
                            Phase {phase.phase}
                        </button>
                    {/each}
                </div>
                
                <div class="phase-content">
                    {#if activePhaseIndex < phaseConfigs.length}
                        <div class="phase-details" in:fade={{ duration: 150 }}>
                            <h3>{phaseConfigs[activePhaseIndex].title}</h3>
                            <p class="phase-description">
                                {#if activePhaseIndex === 0}
                                    This is the starting phase. Select information that should be revealed at the beginning of the game.
                                {:else if activePhaseIndex === phaseConfigs.length - 1}
                                    This is the final phase. Select any remaining information to reveal for the player's last guess.
                                {:else}
                                    Select information to reveal during this phase of the game.
                                {/if}
                            </p>
                            
                            <div class="info-selection">
                                <h4>Information Revealed in this Phase:</h4>
                                <div class="info-grid">
                                    {#each availableInfoTypes as info}
                                        {@const infoInPhase = isInfoInPhase(activePhaseIndex, info.id)}
                                        {@const infoAvailable = isInfoAvailableForPhase(activePhaseIndex, info.id) || infoInPhase}
                                        {@const isUsedElsewhere = isInfoUsed(info.id) && !infoInPhase}
                                        
                                        <div class="info-item {infoInPhase ? 'selected' : ''} {!infoAvailable ? 'unavailable' : ''} {isUsedElsewhere ? 'used-elsewhere' : ''}">
                                            <label>
                                                <input 
                                                    type="checkbox" 
                                                    checked={infoInPhase}
                                                    disabled={!infoAvailable && !infoInPhase}
                                                    on:change={() => toggleInfoInPhase(activePhaseIndex, info.id)}
                                                />
                                                <span class="info-label">{info.description}</span>
                                                
                                                {#if isUsedElsewhere}
                                                    <span class="info-note">Used in another phase</span>
                                                {:else if !infoAvailable}
                                                    <span class="info-note">Already revealed in an earlier phase</span>
                                                {/if}
                                            </label>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
                
                {#if duplicateInfoItems.length > 0}
                    <div class="warning-panel" in:slide={{ duration: 200 }}>
                        <h4>⚠️ Warning: Duplicate Information</h4>
                        <p>The following information appears in multiple phases, which may confuse players:</p>
                        <ul>
                            {#each duplicateInfoItems as info}
                                <li>{info.description}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
                
                {#if unusedInfoTypes.length > 0}
                    <div class="info-panel" in:slide={{ duration: 200 }}>
                        <h4>ℹ️ Unused Information</h4>
                        <p>The following information is not used in any phase:</p>
                        <ul>
                            {#each unusedInfoTypes as info}
                                <li>{info.description}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>
        {:else}
            <div class="legacy-mode" in:fade={{ duration: 200 }}>
                <div class="legacy-description">
                    <p>This is the original configuration mode where information is revealed in a sequential order.</p>
                    <p>The first item is shown at the start, and additional items are revealed after each incorrect guess.</p>
                </div>
                
                <div class="clue-order-list">
                    {#each legacyInfoOrder as info, index}
                        <div class="clue-item">
                            <div class="clue-number">{index + 1}</div>
                            <div class="clue-info">
                                <div class="clue-description">{info.description}</div>
                            </div>
                            <div class="clue-actions">
                                <button class="move-btn" on:click={() => {
                                    if (index > 0) {
                                        const newOrder = [...legacyInfoOrder];
                                        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                                        legacyInfoOrder = newOrder;
                                    }
                                }} disabled={index === 0}>
                                    ↑
                                </button>
                                <button class="move-btn" on:click={() => {
                                    if (index < legacyInfoOrder.length - 1) {
                                        const newOrder = [...legacyInfoOrder];
                                        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                                        legacyInfoOrder = newOrder;
                                    }
                                }} disabled={index === legacyInfoOrder.length - 1}>
                                    ↓
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
        
        <div class="card-actions">
            <button class="secondary-btn" on:click={() => showConfirmReset = true}>
                Reset to Defaults
            </button>
            <button class="primary-btn" on:click={saveSettings}>
                Save Changes
            </button>
        </div>
        
        {#if saved}
            <div class="save-notification" transition:fade>
                Settings saved successfully!
            </div>
        {/if}
        
        {#if showConfirmReset}
            <div class="confirm-modal" transition:fade>
                <div class="confirm-content">
                    <h3>Reset Settings?</h3>
                    <p>This will revert all settings to their default values. This action cannot be undone.</p>
                    <div class="confirm-actions">
                        <button class="cancel-btn" on:click={() => showConfirmReset = false}>Cancel</button>
                        <button class="danger-btn" on:click={resetToDefaults}>Reset</button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
    
    <div class="game-summary">
        <h3>Game Overview</h3>
        <p class="summary-description">
            Your current configuration gives players the following information as they progress:
        </p>
        
        <div class="phase-summary">
            {#each phaseConfigs as phase, phaseIndex}
                <div class="phase-summary-item">
                    <div class="phase-number">{phase.phase}</div>
                    <div class="phase-info">
                        <h4>{phase.title}</h4>
                        <div class="info-tags">
                            {#if phase.infoTypes.length === 0}
                                <span class="empty-tag">No information revealed</span>
                            {:else}
                                {#each phase.infoTypes as infoId}
                                    {@const info = getInfoById(infoId)}
                                    {#if info}
                                        <span class="info-tag">{info.description}</span>
                                    {/if}
                                {/each}
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
    
    <div class="navigation">
        <a href="/game" class="nav-link">Back to Game</a>
        <a href="/" class="nav-link">Home</a>
    </div>
</div>


    <style>
        :global(:root) {
            --bg-color: #1a1a1a;
            --card-bg: #2a2a2a;
            --card-bg-accent: #323232;
            --text-color: #e0e0e0;
            --text-muted: #aaaaaa;
            --heading-color: #ffffff;
            --border-color: #444444;
            --accent-color: #ff3e00;
            --accent-hover: #ff5c26;
            --accent-light: rgba(255, 62, 0, 0.1);
            --success-color: #4CAF50;
            --info-color: #2196F3;
            --warning-color: #FF9800;
            --danger-color: #f44336;
        }
    
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem 1rem;
            color: var(--text-color);
            background-color: var(--bg-color);
        }
        
        h1, h2, h3, h4 {
            color: var(--heading-color);
            margin-bottom: 1.5rem;
        }
        
        .card {
            background-color: var(--card-bg);
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            margin-bottom: 2rem;
            position: relative;
            border: 1px solid var(--border-color);
        }
        
        .card-header {
            margin-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1rem;
        }
        
        .card-header p {
            color: var(--text-muted);
        }
        
        .tabs {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
        }
        
        .tabs button {
            padding: 0.5rem 1rem;
            background-color: var(--card-bg-accent);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            color: var(--text-color);
            transition: all 0.2s ease;
        }
        
        .tabs button:hover {
            background-color: var(--border-color);
        }
        
        .tabs button.active {
            background-color: var(--accent-color);
            color: white;
            border-color: var(--accent-color);
        }
        
        /* Phase tabs */
        .phase-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
        }
        
        .phase-tab {
            padding: 0.6rem 1rem;
            background-color: var(--card-bg-accent);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            color: var(--text-color);
            transition: all 0.2s ease;
        }
        
        .phase-tab:hover {
            background-color: var(--border-color);
        }
        
        .phase-tab.active {
            background-color: var(--accent-color);
            color: white;
            border-color: var(--accent-color);
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        /* Phase content */
        .phase-content {
            background-color: var(--card-bg-accent);
            border-radius: 6px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            min-height: 300px;
            border: 1px solid var(--border-color);
        }
        
        .phase-description {
            margin-bottom: 1.5rem;
            color: var(--text-muted);
            font-style: italic;
        }
        
        /* Info selection */
        .info-selection h4 {
            margin-bottom: 1rem;
            color: var(--text-color);
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
        }
        
        .info-item {
            padding: 1rem;
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            transition: all 0.2s ease;
        }
        
        .info-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .info-item.selected {
            background-color: rgba(76, 175, 80, 0.2);
            border-color: var(--success-color);
        }
        
        .info-item.unavailable {
            opacity: 0.6;
        }
        
        .info-item.used-elsewhere {
            background-color: rgba(255, 152, 0, 0.2);
            border-color: var(--warning-color);
        }
        
        .info-item label {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            cursor: pointer;
            color: var(--text-color);
        }
        
        .info-item input[type="checkbox"] {
            margin-right: 0.5rem;
            accent-color: var(--accent-color);
        }
        
        .info-label {
            font-weight: 500;
        }
        
        .info-note {
            font-size: 0.8rem;
            color: var(--text-muted);
            font-style: italic;
        }
        
        /* Warning and info panels */
        .warning-panel, .info-panel {
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1.5rem;
        }
        
        .warning-panel {
            background-color: rgba(255, 152, 0, 0.15);
            border: 1px solid var(--warning-color);
        }
        
        .info-panel {
            background-color: rgba(33, 150, 243, 0.15);
            border: 1px solid var(--info-color);
        }
        
        .warning-panel h4, .info-panel h4 {
            margin-top: 0;
            margin-bottom: 0.5rem;
        }
        
        /* Legacy mode */
        .legacy-description {
            background-color: var(--card-bg-accent);
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1.5rem;
            border: 1px solid var(--border-color);
        }
        
        .clue-order-list {
            margin-bottom: 1.5rem;
        }
        
        .clue-item {
            display: flex;
            align-items: center;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            margin-bottom: 0.5rem;
            background-color: var(--card-bg-accent);
        }
        
        .clue-number {
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--accent-color);
            color: white;
            border-radius: 50%;
            margin-right: 1rem;
            font-weight: bold;
        }
        
        .clue-info {
            flex: 1;
        }
        
        .clue-description {
            font-weight: 500;
            color: var(--text-color);
        }
        
        .clue-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .move-btn {
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            color: var(--text-color);
        }
        
        .move-btn:hover {
            background-color: var(--border-color);
        }
        
        .move-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* Game summary */
        .game-summary {
            background-color: var(--card-bg);
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            margin-bottom: 2rem;
            border: 1px solid var(--border-color);
        }
        
        .summary-description {
            margin-bottom: 1.5rem;
            color: var(--text-muted);
        }
        
        .phase-summary {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .phase-summary-item {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1rem;
            background-color: var(--card-bg-accent);
            border-radius: 6px;
            border-left: 4px solid var(--accent-color);
            transition: transform 0.2s ease;
        }
        
        .phase-summary-item:hover {
            transform: translateX(4px);
        }
        
        .phase-number {
            width: 2.5rem;
            height: 2.5rem;
            background-color: var(--accent-color);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.2rem;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        .phase-info {
            flex: 1;
        }
        
        .phase-info h4 {
            margin-top: 0;
            margin-bottom: 0.5rem;
        }
        
        .info-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .info-tag {
            background-color: rgba(33, 150, 243, 0.2);
            color: #64B5F6;
            padding: 0.35rem 0.7rem;
            border-radius: 4px;
            font-size: 0.9rem;
            border: 1px solid rgba(33, 150, 243, 0.3);
        }
        
        .empty-tag {
            background-color: rgba(158, 158, 158, 0.2);
            color: #9E9E9E;
            padding: 0.35rem 0.7rem;
            border-radius: 4px;
            font-size: 0.9rem;
            font-style: italic;
            border: 1px solid rgba(158, 158, 158, 0.3);
        }
        
        /* Buttons */
        .card-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 1.5rem;
        }
        
        .primary-btn, .secondary-btn, .danger-btn, .cancel-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .primary-btn {
            background-color: var(--accent-color);
            color: white;
        }
        
        .primary-btn:hover {
            background-color: var(--accent-hover);
            transform: translateY(-2px);
        }
        
        .secondary-btn {
            background-color: var(--card-bg-accent);
            border: 1px solid var(--border-color);
            color: var(--text-color);
        }
        
        .secondary-btn:hover {
            background-color: var(--border-color);
            transform: translateY(-2px);
        }
        
        .danger-btn {
            background-color: var(--danger-color);
            color: white;
        }
        
        .danger-btn:hover {
            background-color: #d32f2f;
            transform: translateY(-2px);
        }
        
        .cancel-btn {
            background-color: var(--card-bg-accent);
            border: 1px solid var(--border-color);
            color: var(--text-color);
        }
        
        .cancel-btn:hover {
            background-color: var(--border-color);
            transform: translateY(-2px);
        }
        
        /* Save notification */
        .save-notification {
            margin-top: 1rem;
            padding: 0.75rem;
            background-color: var(--success-color);
            color: white;
            border-radius: 4px;
            text-align: center;
        }
        
        /* Confirm reset modal */
        .confirm-modal {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            z-index: 100;
        }
        
        .confirm-content {
            background-color: var(--card-bg);
            padding: 2rem;
            border-radius: 8px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            border: 1px solid var(--border-color);
        }
        
        .confirm-content h3 {
            margin-top: 0;
            margin-bottom: 1rem;
        }
        
        .confirm-content p {
            color: var(--text-muted);
        }
        
        .confirm-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 1.5rem;
        }
        
        /* Navigation */
        .navigation {
            display: flex;
            gap: 1rem;
        }
        
        .nav-link {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background-color: var(--card-bg-accent);
            color: var(--text-color);
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            border: 1px solid var(--border-color);
            transition: all 0.2s ease;
        }
        
        .nav-link:hover {
            background-color: var(--border-color);
            transform: translateY(-2px);
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .card-actions {
                flex-direction: column;
                gap: 1rem;
            }
            
            .card-actions button {
                width: 100%;
            }
        }
    </style>