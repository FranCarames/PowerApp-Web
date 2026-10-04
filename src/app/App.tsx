import { RouterProvider } from 'react-router/dom';

import { ColdStartNotice } from './ColdStartNotice';
import { Providers } from './Providers';
import { router } from './router';

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
      <ColdStartNotice />
    </Providers>
  );
}
