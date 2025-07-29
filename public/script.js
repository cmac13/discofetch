// DOM elements
const form = document.getElementById('discographyForm');
const fetchBtn = document.getElementById('fetchBtn');
const spinner = document.getElementById('spinner');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const artistInfo = document.getElementById('artistInfo');
const tabContent = document.getElementById('tabContent');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const copyJsonBtn = document.getElementById('copyJsonBtn');
const errorMessage = document.getElementById('errorMessage');

// Global variables
let currentDiscography = null;
let activeTab = 'albums';

// Utility functions
function formatDuration(durationMs) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    resultsSection.style.display = 'none';
}

function hideError() {
    errorSection.style.display = 'none';
}

function setLoading(loading) {
    if (loading) {
        fetchBtn.classList.add('loading');
        fetchBtn.disabled = true;
    } else {
        fetchBtn.classList.remove('loading');
        fetchBtn.disabled = false;
    }
}

// Render artist information
function renderArtistInfo(artist) {
    const avatarUrl = artist.images && artist.images.length > 0 
        ? artist.images[0].url 
        : 'https://via.placeholder.com/120x120/667eea/ffffff?text=♪';

    artistInfo.innerHTML = `
        <img src="${avatarUrl}" alt="${artist.artist_name}" class="artist-avatar" onerror="this.src='https://via.placeholder.com/120x120/667eea/ffffff?text=♪'">
        <h2 class="artist-name">${artist.artist_name}</h2>
        <div class="artist-stats">
            <div class="stat">
                <div class="stat-value">${formatNumber(artist.followers || 0)}</div>
                <div class="stat-label">Followers</div>
            </div>
            <div class="stat">
                <div class="stat-value">${artist.total_releases.total}</div>
                <div class="stat-label">Total Releases</div>
            </div>
            <div class="stat">
                <div class="stat-value">${artist.total_releases.albums}</div>
                <div class="stat-label">Albums</div>
            </div>
            <div class="stat">
                <div class="stat-value">${artist.total_releases.singles}</div>
                <div class="stat-label">Singles</div>
            </div>
        </div>
        ${artist.genres && artist.genres.length > 0 ? `
            <div class="mt-2">
                <strong>Genres:</strong> ${artist.genres.join(', ')}
            </div>
        ` : ''}
    `;
}

// Render release cards
function renderReleases(releases, type) {
    if (!releases || releases.length === 0) {
        return `
            <div class="text-center" style="padding: 2rem; color: #7f8c8d;">
                <p>No ${type} found</p>
            </div>
        `;
    }

    return `
        <div class="releases-grid">
            ${releases.map(release => {
                const coverUrl = release.images && release.images.length > 0 
                    ? release.images[release.images.length - 1].url 
                    : 'https://via.placeholder.com/80x80/667eea/ffffff?text=♪';

                // Calculate some stats for the release
                const tracksWithISRC = release.tracks.filter(t => t.isrc).length;
                const avgPopularity = release.avg_track_popularity || 0;
                const hasPreview = release.tracks.some(t => t.preview_url);

                return `
                    <div class="release-card">
                        <div class="release-header">
                            <img src="${coverUrl}" alt="${release.release_name}" class="release-cover" onerror="this.src='https://via.placeholder.com/80x80/667eea/ffffff?text=♪'">
                            <div class="release-info">
                                <h3>${release.release_name}</h3>
                                <div class="release-meta">
                                    ${formatDate(release.release_date)} • ${release.total_tracks} track${release.total_tracks !== 1 ? 's' : ''}
                                    ${release.release_date_precision && release.release_date_precision !== 'day' ? ` (${release.release_date_precision} precision)` : ''}
                                </div>
                                <span class="release-type">${release.release_type}</span>
                                ${release.label ? `<div class="mt-1" style="font-size: 0.8rem; color: #7f8c8d;">${release.label}</div>` : ''}
                            </div>
                        </div>
                        
                        <div class="catalog-metadata" style="margin: 1rem 0; padding: 0.75rem; background: #f8f9fa; border-radius: 6px; font-size: 0.85rem;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                                ${avgPopularity > 0 ? `<div><strong>Popularity:</strong> ${avgPopularity}/100</div>` : ''}
                                ${release.market_count ? `<div><strong>Markets:</strong> ${release.market_count}</div>` : ''}
                                ${tracksWithISRC > 0 ? `<div><strong>ISRC:</strong> ${tracksWithISRC}/${release.total_tracks}</div>` : ''}
                                ${hasPreview ? `<div><strong>Preview:</strong> Available</div>` : ''}
                            </div>
                            ${release.external_ids?.upc ? `<div class="mt-1"><strong>UPC:</strong> ${release.external_ids.upc}</div>` : ''}
                            ${release.copyrights && release.copyrights.length > 0 ? `
                                <div class="mt-1"><strong>Rights:</strong> ${release.copyrights.map(c => c.text).join(', ')}</div>
                            ` : ''}
                        </div>

                        <div class="tracks-list">
                            ${release.tracks.map(track => `
                                <div class="track">
                                    <span class="track-number">${track.disc_number && track.disc_number > 1 ? `${track.disc_number}-` : ''}${track.track_number}</span>
                                    <span class="track-name">
                                        ${track.track_name}${track.explicit ? ' 🅴' : ''}
                                        ${track.isrc ? ' 📋' : ''}
                                        ${track.preview_url ? ' 🎵' : ''}
                                        ${track.popularity > 70 ? ' 🔥' : ''}
                                    </span>
                                    <span class="track-duration">${formatDuration(track.duration_ms)}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        ${release.tracks.some(t => t.isrc || t.popularity > 0) ? `
                            <div class="track-legend" style="margin-top: 0.5rem; font-size: 0.75rem; color: #6c757d;">
                                📋 ISRC Available • 🎵 Preview Available • 🔥 High Popularity (70+) • 🅴 Explicit
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Handle tab switching
function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    activeTab = tabName;

    // Update tab content
    if (currentDiscography && currentDiscography.discography) {
        const releases = currentDiscography.discography[tabName] || [];
        tabContent.innerHTML = renderReleases(releases, tabName);
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(form);
    const artistUrl = formData.get('artistUrl').trim();
    
    if (!artistUrl) {
        showError('Please enter a Spotify artist URL');
        return;
    }

    setLoading(true);
    hideError();

    try {
        const response = await fetch('/api/discography', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ artistUrl })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        currentDiscography = data;
        
        // Render artist info
        renderArtistInfo(data);
        
        // Update tab counts
        document.querySelector('[data-tab="albums"]').textContent = `Albums (${data.total_releases.albums})`;
        document.querySelector('[data-tab="singles"]').textContent = `Singles (${data.total_releases.singles})`;
        document.querySelector('[data-tab="compilations"]').textContent = `Compilations (${data.total_releases.compilations})`;
        document.querySelector('[data-tab="appears_on"]').textContent = `Appears On (${data.total_releases.appears_on})`;
        
        // Show initial tab content
        switchTab(activeTab);
        
        // Show results
        resultsSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error fetching discography:', error);
        showError(error.message || 'Failed to fetch discography. Please check the URL and try again.');
    } finally {
        setLoading(false);
    }
}

// Export functionality
function exportAsJson() {
    if (!currentDiscography) return;
    
    const dataStr = JSON.stringify(currentDiscography, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDiscography.artist_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_discography.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

function exportAsCsv() {
    if (!currentDiscography) return;
    
    // Create CSV data for catalog management
    const csvRows = [];
    
    // Headers optimized for catalog administration with enhanced metadata
    csvRows.push([
        'Artist Name',
        'Release Name',
        'Release Type',
        'Release Date',
        'Release Date Precision',
        'Release Year',
        'Release Month',
        'Release Day', 
        'Label',
        'Total Tracks',
        'Release Popularity',
        'Avg Track Popularity',
        'Available Markets Count',
        'Track Number',
        'Disc Number',
        'Track Name',
        'Track Duration (ms)',
        'Track Duration (formatted)',
        'Explicit',
        'Track Popularity',
        'ISRC',
        'Preview Available',
        'Spotify Release ID',
        'Spotify Track ID',
        'Track Artists',
        'Copyrights',
        'Genres',
        'UPC/EAN'
    ].join(','));
    
    // Process each release type
    Object.entries(currentDiscography.discography).forEach(([releaseType, releases]) => {
        releases.forEach(release => {
            release.tracks.forEach(track => {
                const row = [
                    `"${currentDiscography.artist_name.replace(/"/g, '""')}"`,
                    `"${release.release_name.replace(/"/g, '""')}"`,
                    release.release_type,
                    release.release_date,
                    release.release_date_precision || 'day',
                    release.release_year || '',
                    release.release_month || '',
                    release.release_day || '',
                    `"${(release.label || 'Unknown').replace(/"/g, '""')}"`,
                    release.total_tracks,
                    release.popularity || 0,
                    release.avg_track_popularity || 0,
                    release.market_count || 0,
                    track.track_number,
                    track.disc_number || 1,
                    `"${track.track_name.replace(/"/g, '""')}"`,
                    track.duration_ms,
                    formatDuration(track.duration_ms),
                    track.explicit ? 'YES' : 'NO',
                    track.popularity || 0,
                    track.isrc || '',
                    track.preview_url ? 'YES' : 'NO',
                    release.spotify_album_id,
                    track.spotify_track_id,
                    `"${track.artists ? track.artists.map(a => a.name).join('; ').replace(/"/g, '""') : currentDiscography.artist_name}"`,
                    `"${release.copyrights ? release.copyrights.map(c => `${c.type}: ${c.text}`).join('; ').replace(/"/g, '""') : ''}"`,
                    `"${release.genres ? release.genres.join('; ').replace(/"/g, '""') : ''}"`,
                    release.external_ids?.upc || release.external_ids?.ean || ''
                ];
                csvRows.push(row.join(','));
            });
        });
    });
    
    const csvContent = csvRows.join('\n');
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDiscography.artist_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_catalog_enhanced.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

async function copyJsonToClipboard() {
    if (!currentDiscography) return;
    
    try {
        const jsonString = JSON.stringify(currentDiscography, null, 2);
        await navigator.clipboard.writeText(jsonString);
        
        // Show feedback
        const originalText = copyJsonBtn.textContent;
        copyJsonBtn.textContent = 'Copied!';
        copyJsonBtn.style.background = '#28a745';
        copyJsonBtn.style.color = 'white';
        
        setTimeout(() => {
            copyJsonBtn.textContent = originalText;
            copyJsonBtn.style.background = '';
            copyJsonBtn.style.color = '';
        }, 2000);
        
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = JSON.stringify(currentDiscography, null, 2);
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// Event listeners
form.addEventListener('submit', handleFormSubmit);

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        const tabName = e.target.getAttribute('data-tab');
        switchTab(tabName);
    });
});

// Export buttons
exportJsonBtn.addEventListener('click', exportAsJson);
exportCsvBtn.addEventListener('click', exportAsCsv);
copyJsonBtn.addEventListener('click', copyJsonToClipboard);

// Sample URLs for easy testing (you can remove this in production)
document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('artistUrl');
    
    // Add some sample URLs as a data attribute for development
    urlInput.setAttribute('data-samples', JSON.stringify([
        'https://open.spotify.com/artist/7dGJo4pcD2V6oG8kP0tJRR', // Eminem
        'https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ', // The Weeknd
        'https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02', // Taylor Swift
        'https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4'  // Drake
    ]));
});