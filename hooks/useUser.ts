import { useState } from 'react';

interface User {
  id: number;
  email: string;
  verified: boolean;
  active: boolean;
}

export const useUser = (): User => {
  const [user] = useState<User>({
    id: 1,
    email: 'example@dota.com',
    verified: true,
    active: true,
  });

  return user;
};
