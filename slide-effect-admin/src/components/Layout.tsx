import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Image, Video, Headphones,
  FileText, Globe, AppWindow, ListVideo, SquarePlay,
  Calendar, Monitor, ChevronDown, ChevronRight,
  Upload, User, LogOut, ChevronLeft, Tv2,
  ShieldCheck, Palette, ImageIcon, Wrench, Tag, Users
} from 'lucide-react'

const navMain = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/' },
  {
    label: 'Médias', icon: FolderOpen, path: '/medias',
    children: [
      { label: 'Tous les médias', icon: FolderOpen, path: '/medias' },
      { label: 'Images', icon: Image, path: '/medias?type=image' },
      { label: 'Vidéos', icon: Video, path: '/medias?type=video' },
      { label: 'Audio', icon: Headphones, path: '/medias?type=audio' },
      { label: 'Documents', icon: FileText, path: '/medias?type=doc' },
      { label: 'Pages Web', icon: Globe, path: '/medias?type=web' },
    ]
  },
  { label: 'Apps', icon: AppWindow, path: '/apps' },
  { label: 'Playlists', icon: ListVideo, path: '/playlists' },
  { label: 'Compositions', icon: SquarePlay, path: '/compositions' },
  { label: 'Programmation', icon: Calendar, path: '/programmation' },
  { label: 'Écrans', icon: Monitor, path: '/ecrans' },
]

const navAdmin = [
  { label: 'Utilisateurs', icon: Users, path: '/utilisateurs' },
  {
    label: 'Super Admin', icon: ShieldCheck, path: '/superadmin',
    children: [
      { label: 'Thème & Couleurs', icon: Palette, path: '/superadmin/theme' },
      { label: 'Logo & Identité', icon: ImageIcon, path: '/superadmin/branding' },
      { label: 'Menu & Navigation', icon: Tag, path: '/superadmin/menu' },
      { label: 'Widgets & Outils', icon: Wrench, path: '/superadmin/widgets' },
    ]
  },
]

const pageLabels: Record<string, string> = {
  '/': 'Tableau de bord',
  '/medias': 'Médias',
  '/apps': 'Apps',
  '/playlists': 'Playlists',
  '/compositions': 'Compositions',
  '/programmation': 'Programmation',
  '/ecrans': 'Écrans',
  '/utilisateurs': 'Utilisateurs',
  '/superadmin/theme': 'Thème & Couleurs',
  '/superadmin/branding': 'Logo & Identité',
  '/superadmin/menu': 'Menu & Navigation',
  '/superadmin/widgets': 'Widgets & Outils',
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mediasOpen, setMediasOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Admin","role":"admin"}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const currentLabel = pageLabels[location.pathname] || ''
  const isPlaylistEditor = location.pathname.startsWith('/playlists/') && location.pathname !== '/playlists'
  const isCompositionEditor = location.pathname.startsWith('/compositions/') && location.pathname !== '/compositions'

  if (isCompositionEditor) {
    return <Outlet />
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Tv2 size={18} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm">Slide Effect</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto">
              <Tv2 size={18} className="text-white" />
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 ml-auto">
            <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav principale */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navMain.map((item) => {
            if (item.children) {
              return (
                <div key={item.path}>
                  <button onClick={() => setMediasOpen(!mediasOpen)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                      ${isActive(item.path) ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <item.icon size={18} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {mediasOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </>
                    )}
                  </button>
                  {!collapsed && mediasOpen && (
                    <div className="pl-8">
                      {item.children.map((child) => (
                        <Link key={child.path} to={child.path}
                          className={`flex items-center gap-2 px-3 py-2 text-xs rounded transition-colors
                            ${location.pathname + location.search === child.path ? 'text-orange-500 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                          <child.icon size={14} />{child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${isActive(item.path) ? 'text-orange-500 bg-orange-50 font-medium border-r-2 border-orange-500' : 'text-gray-600 hover:bg-gray-50'}`}>
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}

          {/* Séparateur Admin - visible seulement pour admin */}
          {user.role === 'admin' && (
            <>
              {!collapsed && (
                <div className="px-4 pt-4 pb-1">
                  <span className="text-xs text-gray-300 uppercase tracking-wider font-semibold">Administration</span>
                </div>
              )}
              {collapsed && <div className="border-t border-gray-100 mx-3 my-2" />}

              {navAdmin.map((item) => {
                if (item.children) {
                  return (
                    <div key={item.path}>
                      <button onClick={() => setAdminOpen(!adminOpen)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                          ${isActive(item.path) ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <item.icon size={18} className={isActive(item.path) ? 'text-purple-500' : 'text-gray-400'} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            {adminOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </>
                        )}
                      </button>
                      {!collapsed && adminOpen && (
                        <div className="pl-8">
                          {item.children.map((child) => (
                            <Link key={child.path} to={child.path}
                              className={`flex items-center gap-2 px-3 py-2 text-xs rounded transition-colors
                                ${location.pathname === child.path ? 'text-purple-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                              <child.icon size={14} />{child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }
                return (
                  <Link key={item.path} to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                      ${isActive(item.path) ? 'text-purple-600 bg-purple-50 font-medium border-r-2 border-purple-500' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <item.icon size={18} className={isActive(item.path) ? 'text-purple-500' : 'text-gray-400'} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* Bas sidebar */}
        <div className={`${collapsed ? 'px-2' : 'p-4'} border-t border-gray-100`}>
          {!collapsed && <div className="text-xs text-gray-400 mb-2">Espace de travail</div>}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
              <User size={14} className="text-orange-500" />
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{user.name || user.email}</span>
                <button onClick={logout} className="hover:text-red-500 transition-colors">
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - hidden for playlist editor */}
        {!isPlaylistEditor && (
          <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900 flex-1">{currentLabel}</h1>
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50">
              <Upload size={15} /> Importer
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-500 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50">
              Tous les espaces...
            </button>
            <button className="flex items-center gap-2 text-sm px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50">
              <User size={15} />
            </button>
            <button onClick={logout} className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded font-medium hover:bg-gray-800">
              Déconnexion
            </button>
          </header>
        )}

        {/* Content */}
        <main className={`flex-1 overflow-auto ${isPlaylistEditor ? 'p-0' : 'p-6'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
