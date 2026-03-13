import { useState } from "react"
import { api } from "../../api/urbanmindAPI"
import html2canvas from "html2canvas"

export default function ExplainButton({ chartRef }) {
  const [explanation, setExplanation] = useState("")
  const [loading, setLoading] = useState(false)

  const handleExplain = async () => {
    if (!chartRef.current) return
    setLoading(true)
    setExplanation("")
    try {
      // Capture chart as PNG blob
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: null,
        scale: 2 // Higher quality for Gemini
      })
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"))
      if (!blob) throw new Error("Blob creation failed")
      
      const result = await api.explainChart(blob)
      if (result.error) throw new Error(result.error)
      
      setExplanation(result.explanation)
    } catch (err) {
      console.error(err)
      setExplanation("Could not analyze chart at this moment.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={handleExplain}
        disabled={loading}
        style={{
          padding: '8px 16px',
          background: loading ? 'rgba(132, 177, 121, 0.1)' : 'rgba(132, 177, 121, 0.15)',
          border: '1px solid rgba(132, 177, 121, 0.3)',
          borderRadius: 8,
          color: '#84B179',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.2s'
        }}
      >
        {loading ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
            Analyzing...
          </>
        ) : (
          <>
            <span>🔍</span>
            Explain this chart
          </>
        )}
      </button>

      {explanation && (
        <div style={{
          marginTop: 12,
          padding: 16,
          background: 'rgba(255, 255, 255, 0.03)',
          borderLeft: '4px solid #84B179',
          borderRadius: '0 8px 8px 0',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          color: 'var(--text-main)'
        }}>
          <div style={{ fontWeight: 800, color: '#84B179', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🤖</span> AI Insight
          </div>
          <p style={{ margin: 0 }}>{explanation}</p>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
