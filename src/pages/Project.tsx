import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectsStore } from '@/store/projects'
import WorkspaceLayout from '@/components/layout/WorkspaceLayout'

export default function Project() {
  const { id } = useParams<{ id: string }>()
  const { setCurrentProject, loadProjects, projects } = useProjectsStore()

  useEffect(() => {
    if (projects.length === 0) loadProjects()
  }, [])

  useEffect(() => {
    if (id) setCurrentProject(id)
    return () => setCurrentProject(null)
  }, [id])

  return <WorkspaceLayout />
}
