import { useState } from 'react';

import CirclePack from './CirclePack';
import styles from './App.module.css';

function App() {
  const [selectedRole, setSelectedRole] = useState({});

  const onRoleChanged = (role) => {
    setSelectedRole(role);
  }

  return (
    <div className={styles.container}>
      <div className={styles.circlePack}>
        <CirclePack onRoleChange={onRoleChanged} />
      </div>
      <div className={styles.sidebar}>
        <h3>{selectedRole.role_name}</h3>
        <pre>{selectedRole.text}</pre>
      </div>
    </div>
  );
}

export default App;
