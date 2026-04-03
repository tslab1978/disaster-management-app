export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🏥 災害対策委員会管理システム</h1>
      <p style={{ color: '#666' }}>三重中央医療センター 統合管理ダッシュボード</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginTop: '2rem'
      }}>
        <div style={{ 
          border: '1px solid #ddd', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#0084ff' }}>📋 訓練班</h2>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#0084ff' }}>0%</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>年間タスク進捗</p>
        </div>
        
        <div style={{ 
          border: '1px solid #ddd', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#8b5cf6' }}>🛠️ 物品班</h2>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>7</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>管理エリア</p>
        </div>
        
        <div style={{ 
          border: '1px solid #ddd', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#06b6d4' }}>💬 連絡</h2>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#06b6d4' }}>0</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>待機中</p>
        </div>
      </div>
      
      <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px', borderLeft: '4px solid #0084ff' }}>
        <p style={{ margin: 0, color: '#333' }}>
          ✅ <strong>ダッシュボード準備完了！</strong><br/>
          本格的な機能は現在開発中です。
        </p>
      </div>
    </main>
  );
}
