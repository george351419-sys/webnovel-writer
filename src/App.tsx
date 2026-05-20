import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import ToastProvider from '@/components/ui/ToastProvider'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastProvider />
    </>
  )
}
