import { cookies } from 'next/headers'
import Navbar from './NavBar'

export default function NavbarWrapper({ name, logo }) {
  const jwtCookie = cookies().get('jwt')?.value
  return <Navbar name={name} logo={logo} initialLoggedIn={!!jwtCookie} />
}