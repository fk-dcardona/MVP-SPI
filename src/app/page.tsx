import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/core/auth/login');
}
