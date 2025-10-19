import React from 'react';
import UserActions from './UserActions';

const TrailDetailActions = ({ user, trail, userSaved, onTrailAction }) => {
  return (
    <UserActions user={user} trail={trail} userSaved={userSaved} onTrailAction={onTrailAction} />
  );
};

export default TrailDetailActions;
