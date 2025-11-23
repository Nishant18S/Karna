import React from 'react';
import { 
  BarChart3, 
  HandCoins, 
  Package, 
  Upload, 
  ShoppingCart, 
  Brain, 
  Bot,
  Leaf,
  Home
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser?: { name: string; aadhaar: string; [key: string]: any } | null;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, currentUser }) => {
  const openSubsidyWorkflow = () => {
    console.log('Opening subsidy workflow with user data:', currentUser);
    
    if (currentUser) {
      // Create URL with farmer data as parameters (encoded for security)
      const subsidyUrl = new URL('http://localhost:5174');
      subsidyUrl.searchParams.set('name', encodeURIComponent(currentUser.name || ''));
      subsidyUrl.searchParams.set('aadhaar', encodeURIComponent(currentUser.aadhaar || ''));
      subsidyUrl.searchParams.set('landArea', encodeURIComponent(currentUser.landSize?.toString() || '0'));
      subsidyUrl.searchParams.set('cropType', encodeURIComponent(currentUser.cropType || 'wheat'));
      
      console.log('Opening subsidy with URL:', subsidyUrl.toString());
      
      // Open subsidy in same tab to preserve sessionStorage
      window.location.href = subsidyUrl.toString();
    } else {
      console.error('No current user data available');
      window.location.href = 'http://localhost:5174';
    }
  };
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'subsidy', label: 'Schemes', icon: HandCoins },
    { id: 'products', label: 'My Products', icon: Package },
    { id: 'upload', label: 'Upload Product', icon: Upload },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    { id: 'ai-schemes', label: 'AI Recommendations', icon: Brain },
  ];

  return (
    <nav className="nav-tabs">
      <div className="nav-tabs-inner">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-tab ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <IconComponent size={16} />
              {item.label}
            </button>
          );
        })}

        <button
          className="nav-tab"
          onClick={openSubsidyWorkflow}
        >
          <Leaf size={16} />
          Farmer Subsidy
        </button>
        {/* <button
          className="nav-tab"
          onClick={() => window.location.href = 'http://localhost:8080/'}
        >
          <Home size={16} />
          Home
        </button> */}
        <button
          className="nav-tab"
          onClick={() => window.location.href = 'demochatbot.html'}
        >
          <Bot size={16} />
          AI Chatbot
        </button>
      </div>
    </nav>
  );
};

export default Navigation;