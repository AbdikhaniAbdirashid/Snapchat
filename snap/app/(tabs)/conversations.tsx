import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ApiError, getFriends } from '@/lib/api';

type Friend = {
  username: string;
  created_at: string;
  mutual: boolean;
};

export default function ConversationsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFriends = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getFriends();
      setFriends(result);
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

  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [])
  );

  if (loading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View>
        <Text>{error}</Text>
      </View>
    );
  }

  if (friends.length === 0) {
    return (
      <View>
        <Text>No friends yet</Text>

        <Button
          title="Add Friend"
          onPress={() => router.push('/add-friend')}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Button
        title="Add Friend"
        onPress={() => router.push('/add-friend')}
      />

      <FlatList
        data={friends}
        keyExtractor={(item) => item.username}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 16,
              opacity: item.mutual ? 1 : 0.5,
            }}
          >
            <Text>{item.username}</Text>
            <Text>{item.mutual ? 'Friends' : 'Pending'}</Text>
          </View>
        )}
      />
    </View>
  );
}