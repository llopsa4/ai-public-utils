import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CampaignApp } from './CampaignApp';
import '../../style.css';

const container = document.getElementById('root');
if (!container) throw new Error('The game root is missing.');
createRoot(container).render(<StrictMode><CampaignApp /></StrictMode>);
