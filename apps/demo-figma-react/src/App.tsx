import { useState, useMemo } from 'react'
import * as Icons from '../icons'
import './App.css'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = React.ComponentType<any>
type IconEntry = [string, IconComponent]

function App(): JSX.Element {
  const [search, setSearch] = useState<string>('')
  const [size, setSize] = useState<number>(24)

  const iconList = useMemo<IconEntry[]>(() => {
    return Object.entries(Icons).filter(
      ([name]) => name !== 'default'
    ) as IconEntry[]
  }, [])

  const filteredIcons = useMemo<IconEntry[]>(() => {
    if (!search) return iconList
    const query = search.toLowerCase()
    return iconList.filter(([name]) => name.toLowerCase().includes(query))
  }, [iconList, search])

  return (
    <div className="app">
      <header className="header">
        <h1>Picto Icons Preview</h1>
        <p className="subtitle">
          {filteredIcons.length} / {iconList.length} icons
        </p>
      </header>

      <div className="controls">
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          className="search-input"
        />
        <div className="size-control">
          <label>Size: {size}px</label>
          <input
            type="range"
            min="16"
            max="64"
            value={size}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSize(Number(e.target.value))
            }
          />
        </div>
      </div>

      <div className="icon-grid">
        {filteredIcons.map(([name, Icon]) => (
          <div key={name} className="icon-item">
            <div className="icon-preview" style={{ fontSize: size }}>
              <Icon width={size} height={size} />
            </div>
            <div className="icon-name">{name}</div>
          </div>
        ))}
      </div>

      {filteredIcons.length === 0 && (
        <div className="empty-state">No icons found for "{search}"</div>
      )}
    </div>
  )
}

export default App
