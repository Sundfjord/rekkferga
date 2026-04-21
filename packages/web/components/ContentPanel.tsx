"use client";

export interface ContentPanelProps {
  children: React.ReactNode;
}

const ContentPanel = ({ children }: ContentPanelProps) => {
  return (
    <div className="flex flex-col h-full overflow-hidden p-4">
      {children}
    </div>
  )
}

export interface ContentPanelHeaderProps {
  children: React.ReactNode;
}

const ContentPanelHeader = ({ children }: ContentPanelHeaderProps) => {
  return (
    <div
      className="flex-shrink-0 relative z-20 p-4 rounded-t-2xl last:rounded-b-2xl"
      style={{ backgroundColor: "var(--surface)"}}
    >
      {children}
    </div>
  )
}

export interface ContentPanelBodyProps {
  children: React.ReactNode;
  fullHeight?: boolean;
}

const ContentPanelBody = ({ children, fullHeight = false }: ContentPanelBodyProps) => {
  return (
    <div
      className={`flex min-h-0 overflow-hidden rounded-b-2xl ${fullHeight ? "flex-1" : "flex-shrink-0"}`}
      style={{ backgroundColor: "var(--surface)"}}
    >
      {children}
    </div>
  )
}

ContentPanel.Body = ContentPanelBody
ContentPanel.Header = ContentPanelHeader

export default ContentPanel


