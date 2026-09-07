import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';

import { addFriend, ApiError } from '@/lib/api';

export default function AddFriendScreen() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const handleAddFriend = async () => {
    setLoading(true);
    setError('');
    setStatus('');

    try {
      const result = await addFriend(username);
      setStatus(result.status);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('Något gick fel');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text>Add Friend</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />

      <Button
        title={loading ? 'Adding...' : 'Add Friend'}
        onPress={handleAddFriend}
        disabled={loading}
      />

      {error ? <Text>{error}</Text> : null}

      {status ? <Text>{status}</Text> : null}
    </View>
  );
}