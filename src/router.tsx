import { createHashRouter } from 'react-router-dom'
import Home from '@/pages/Home'
import Project from '@/pages/Project'
import NewProject from '@/pages/NewProject'
import Settings from '@/pages/Settings'

export const router = createHashRouter([
  { path: '/', element: <Home /> },
  { path: '/new', element: <NewProject /> },
  { path: '/project/:id', element: <Project /> },
  { path: '/settings', element: <Settings /> },
])
