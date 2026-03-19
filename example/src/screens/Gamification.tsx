import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import RnAntsomiSdk, { type GamificationGame } from '../../../src';

const GAMIFICATION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnYW1pZmljYXRpb24tc2RrIiwic3ViIjoiMTA5MTk4NDU5MTkzNjA5NzYwNCIsImFwcF9pZCI6IjU2NDg5MjMzNCIsInBvcnRhbF9pZCI6NTY0ODkyMzM0LCJrZXlfaWQiOiIwMTljMzFlZS00Y2FmLTc0YWQtOTgwNS02YjQwNWUzNDk0ZGYiLCJpYXQiOjE3NzM4OTY4MDMsImV4cCI6MTc3MzkwMDQwM30.OVr1B65OtmlauofrQZhWWvis3EOrfnDc_f9kPaWwgZs';
const GAME_CODE = 'hl-survey';

export default function GamificationScreen() {
    const [games, setGames] = useState<GamificationGame[]>([]);
    const [initialized, setInitialized] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleInit = async () => {
        try {
            setLoading(true);
            await RnAntsomiSdk.initGamification(GAMIFICATION_TOKEN, 'sandbox');
            setInitialized(true);
            Alert.alert('Success', 'Gamification initialized!');
        } catch (error) {
            Alert.alert('Error', String(error));
        } finally {
            setLoading(false);
        }
    };

    const handleGetListGame = async () => {
        try {
            setLoading(true);
            const result = await RnAntsomiSdk.getListGame();
            setGames(result);
            Alert.alert('Success', `Found ${result.length} games`);
        } catch (error) {
            Alert.alert('Error', String(error));
        } finally {
            setLoading(false);
        }
    };

    const handleGetGameByCode = async () => {
        try {
            setLoading(true);
            const game = await RnAntsomiSdk.getGameByCode(GAME_CODE);

            if (game) {
                Alert.alert('Game Found', `Name: ${game.name}\nCode: ${game.gameCode}\nStatus: ${game.status}`);
            } else {
                Alert.alert('Not Found', 'Game not found');
            }
        } catch (error) {
            Alert.alert('Error', String(error));
        } finally {
            setLoading(false);
        }
    };

    const handlePlayGame = async () => {
        try {
            await RnAntsomiSdk.playGame(GAME_CODE);
        } catch (error) {
            Alert.alert('Play Game Error', String(error));
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>🎮 Gamification Test</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Initialize</Text>
                <TouchableOpacity
                    style={[styles.button, initialized && styles.buttonSuccess]}
                    onPress={handleInit}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {initialized ? '✓ Initialized' : 'Init Gamification'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Get Games</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleGetListGame}
                    disabled={loading || !initialized}
                >
                    <Text style={styles.buttonText}>Get List Game</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleGetGameByCode}
                    disabled={loading || !initialized}
                >
                    <Text style={styles.buttonText}>Get Game By Code ({GAME_CODE})</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Play Game</Text>
                <TouchableOpacity
                    style={[styles.button, styles.buttonPlay]}
                    onPress={handlePlayGame}
                    disabled={loading || !initialized}
                >
                    <Text style={styles.buttonText}>🎮 Play Game ({GAME_CODE})</Text>
                </TouchableOpacity>
            </View>

            {games.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Games List ({games.length})</Text>
                    {games.map((game, index) => (
                        <View key={game.gameId || index} style={styles.gameItem}>
                            <Text style={styles.gameName}>{game.name}</Text>
                            <Text style={styles.gameCode}>Code: {game.gameCode}</Text>
                            <Text style={styles.gameStatus}>Status: {game.status}</Text>
                            <TouchableOpacity
                                style={styles.playButton}
                                onPress={async () => {
                                    try {
                                        await RnAntsomiSdk.playGame(game.gameCode);
                                    } catch (error) {
                                        Alert.alert('Play Game Error', String(error));
                                    }
                                }}
                            >
                                <Text style={styles.playButtonText}>Play</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#666',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonSuccess: {
        backgroundColor: '#34C759',
    },
    buttonPlay: {
        backgroundColor: '#FF9500',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    gameItem: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    gameName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    gameCode: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    gameStatus: {
        fontSize: 14,
        color: '#999',
        marginTop: 2,
    },
    playButton: {
        backgroundColor: '#FF9500',
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
    },
    playButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
