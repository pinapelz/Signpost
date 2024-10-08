import React, { useState, useEffect } from 'react';
import './App.css';

const App: React.FC = () => {
  const [apikey, setApikey] = useState<string>('');
  const [announcementKey, setAnnouncementKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [addKey, setAddKey] = useState<string>('');
  const [addContent, setAddContent] = useState<string>('');
  const [addExpiresAt, setAddExpiresAt] = useState<string>('');
  const [addSecret, setAddSecret] = useState<string>('');
  const [addPublic, setAddPublic] = useState<boolean>(true);

  interface AnnouncementData {
    content: string;
    expires_at?: string;
    expires_in_seconds?: number;
    created_at?: string;
  }

  const [announcementData, setAnnouncementData] = useState<AnnouncementData | null>(null);
  const [addModifyMessage, setAddModifyMessage] = useState<string | null>(null);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputType, setInputType] = useState<string>('text');
  const [activeTab, setActiveTab] = useState<string>('view');
  const [instancePublic, setInstancePublic] = useState<boolean>(true);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('apikey');
    if (savedApiKey) {
      setApikey(savedApiKey);
      setInputType('password');
    }
  }, []);

  useEffect(() => {
    fetch('/api/public')
      .then(response => response.json())
      .then(data => {
        setInstancePublic(data.public);
      })
      .catch(error => {
        console.error('Error fetching public announcement:', error);
      });
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApikey(e.target.value);
  };

  const handleApiKeyKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      localStorage.setItem('apikey', apikey);
      alert('API Key saved!');
      setInputType('password');
    }
  };

  const fetchAnnouncement = async () => {
    setLoading(true);
    let headers = {};
    if(instancePublic){
      headers = {
        'Content-Type': 'application/json',
        'secret': apikey,
      }
    }
    else{
      headers = {
        'Content-Type': 'application/json',
        'secret': apikey,
        'master_password': (document.getElementById('masterPassword') as HTMLInputElement).value,
      }
    }
    try {
      const response = await fetch(`/api/announcement/get/${announcementKey}`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error('Announcement not found or incorrect key');
      }

      const data = await response.json();
      setAnnouncementData(data);
      setError(null);
    } catch (err: unknown) {
      setAnnouncementData(null);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const addAnnouncement = async (key: string, content: string, secret: string, pub: boolean, expiresAt: string, masterPass: string) => {
    setLoading(true);
    const secondsUntilExpiry = Math.floor((new Date(expiresAt).getTime() - new Date().getTime()) / 1000);
    try {
      const response = await fetch(`/api/announcement/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: key, value: content, secret: secret, expires_at: secondsUntilExpiry, public: pub, master_password: masterPass }),
      });
      if (!response.ok) {
        setAddModifyMessage('Failed to add announcement');
      }
      setAddModifyMessage('Announcement set/modified successfully!');
      localStorage.setItem('announcementKey', key); // Save the key to localStorage
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (key: string) => {
    setLoading(true);
    let master_pass = "";
    if(!instancePublic)
      master_pass = (document.getElementById('masterPassword') as HTMLInputElement).value
    try {
      const response = await fetch(`/api/announcement/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: key, secret: apikey, master_password:  master_pass}),
      });

      if (!response.ok) {
        setDeletionMessage('Failed to delete announcement');
        throw new Error('Failed to delete announcement');
      }
      alert('Announcement deleted successfully!');
      setDeletionMessage('Announcement deleted successfully!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Signpost</h1>
        <a href="https://github.com/pinapelz/Signpost/blob/main/docs/docs.md">API Reference</a>
        <p>A KV storage text solution designed for hosting plaintext announcements for whatever purpose you need</p>
        <img src="https://files.catbox.moe/y0nnkz.png" alt="Signpost Minecraft"></img>
      </header>
      <main>
        <div className="section">
          <p>Enter the secret you used when setting announcements. We'll remember it for next time too!</p>
          <input
            type={inputType}
            placeholder="API Key - Press Enter after input to save in browser"
            value={apikey}
            onChange={handleApiKeyChange}
            onKeyPress={handleApiKeyKeyPress}
          />
          <input
            type="password"
            placeholder="Master Password - Use only if instance is private"
            id="masterPassword"
            defaultValue=""
            style={{ display: instancePublic ? 'none' : 'block' }}
          />
        </div>
        <div className="tabs">
          <button
            className={activeTab === 'view' ? 'active' : ''}
            onClick={() => setActiveTab('view')}
          >
            View
          </button>
          <button
            className={activeTab === 'add' ? 'active' : ''}
            onClick={() => setActiveTab('add')}
          >
            Add/Modify
          </button>
          <button
            className={activeTab === 'delete' ? 'active' : ''}
            onClick={() => setActiveTab('delete')}
          >
            Delete
          </button>
        </div>
        {loading && <div className="loading">Loading...</div>}
        {activeTab === 'view' && (
          <div className="section">
            <h2>View Announcements</h2>
            <input
              type="text"
              placeholder="Enter Announcement Key"
              value={announcementKey}
              onChange={(e) => setAnnouncementKey(e.target.value)}
            />
            <button onClick={fetchAnnouncement}>Fetch Announcement</button>

            {error && <p className="error">{error}</p>}
            {announcementData && (
              <div className="announcement">
                <h3>Announcement Content:</h3>
                <p>{announcementData.content}</p>
                {announcementData.expires_at && (
                  <p>
                    <strong>Expires at:</strong> {announcementData.expires_at}
                  </p>
                )}
                {announcementData.expires_in_seconds && (
                  <p>
                    <strong>Expires in (seconds):</strong> {announcementData.expires_in_seconds}
                  </p>
                )}
                {announcementData.created_at && (
                  <p>
                    <strong>Created/Modified at:</strong> {new Date(announcementData.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'add' && (
          <div className="section">
            <h2>Add Announcement</h2>
            <p>Set an empty date/time for no expiry!</p>
            <input
              type="text"
              placeholder="Keyword - Term to get the announcement later"
              value={addKey}
              onChange={(e) => setAddKey(e.target.value)}
            />
            <input
              type="text"
              placeholder="Announcement Content"
              value={addContent}
              onChange={(e) => setAddContent(e.target.value)}
            />
            <input
              type="datetime-local"
              placeholder="Expiration Date"
              value={addExpiresAt}
              onChange={(e) => setAddExpiresAt(e.target.value)}
            />
            <input
              type="text"
              placeholder="Key/Secret - Secret that is used to modify/add"
              value={addSecret}
              onChange={(e) => setAddSecret(e.target.value)}
            />
            <label>
              Public
              <input
                type="checkbox"
                checked={addPublic}
                onChange={(e) => setAddPublic(e.target.checked)}
              />
            </label>
            <button
              onClick={() => {
                let masterPass = "";
                if(!instancePublic)
                  masterPass = (document.getElementById('announcementSetMasterPass') as HTMLInputElement).value;
                addAnnouncement(addKey, addContent, addSecret, addPublic, addExpiresAt, masterPass);
              }}
            >
              Add/Modify
            </button>
            {addModifyMessage && <p>{addModifyMessage}</p>}
          </div>
        )}
        {activeTab === 'delete' && (
          <div className="section">
            <h2>Delete Announcement</h2>
            <p>The key you've inputted above will be what we use to authorize the deletion!</p>
            <input
              type="text"
              placeholder="Enter Announcement Key"
              id="deleteAnnouncementKey"
            />
            <button
              onClick={() => {
                const key = (document.getElementById('deleteAnnouncementKey') as HTMLInputElement).value;
                deleteAnnouncement(key);
              }}
            >
              Delete Announcement
            </button>
            {deletionMessage && <p>{deletionMessage}</p>}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;