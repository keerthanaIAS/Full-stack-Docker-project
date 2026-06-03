import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/users")
      .then(res => setUsers(res.data));
  }, []);

  return (
    <div>
      <h1>MERN Docker App</h1>
      {users.map((u: any) => (
        <p key={u.id}>{u.name}</p>
      ))}
    </div>
  );
}

export default App;