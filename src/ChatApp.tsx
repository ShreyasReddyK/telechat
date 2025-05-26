import { useEffect, useState, type JSX } from "react";
import {
	TelepartyClient,
	type SocketEventHandler,
	SocketMessageTypes,
} from "teleparty-websocket-lib";
import type { SocketMessage } from "teleparty-websocket-lib/lib/SocketMessage";

const ChatApp = () => {
	const [client, setClient] = useState<TelepartyClient | null>(null);
	const [name, setName] = useState("");
	const [emoji, setEmoji] = useState("😎");
	const [roomId, setRoomId] = useState<string | undefined>(undefined);
	const [userId, setUserId] = useState<string | undefined>(undefined);
	const [messages, setMessages] = useState<SocketMessage[]>([]);
	const [inRoom, setInRoom] = useState<boolean>(false);
	const [userList, setUserList] = useState<any[]>([]);
	const [messageText, setMessageText] = useState("");
	const emojis = [
		"😎",
		"😀",
		"😂",
		"😭",
		"☠️",
		"🍌",
		"🍎",
		"🍓",
		"🍕",
		"🥑",
		"🦁",
		"🐰",
		"🐶",
		"🐥",
		"🦋",
	];

	useEffect(() => {
		const eventHandler: SocketEventHandler = {
			onConnectionReady: () => {},
			onClose: () => {
				alert("Connection lost, please refresh the page to reconnect.");
				window.location.reload();
			},
			onMessage: (message) => {
				handleMessage(message);
			},
		};
		const client = new TelepartyClient(eventHandler);
		setClient(client);
	}, []);

	function handleMessage(message: any) {
		if (message.type === "userId") {
			setUserId(message.data.userId);
		} else if (message.type === SocketMessageTypes.SEND_MESSAGE) {
			setMessages((prevMessages) => [...prevMessages, message]);
		} else if (message.type === "userList") {
			setUserList(message.data);
		} else if (message.type === SocketMessageTypes.SET_TYPING_PRESENCE) {
			//use userList and message.data.typingUsers to get nicknames later
		} else {
			// Handle other message types
		}
	}

	async function enterRoom(room?: string) {
		if (!client) {
			console.error("Client is not initialized");
			return;
		}
		if (name === "") {
			alert("You must enter a nickname to join a room.");
			return;
		}

		if (room) {
			await client
				.joinChatRoom(name, room, emoji)
				.then(() => {})
				.catch((error) => {
					alert("Error joining room, please try again.");
					console.error("Error joining room:", error);
					window.location.reload();
				});
		} else {
			try {
				const createdRoomId = await client.createChatRoom(name, emoji);
				setRoomId(createdRoomId);
			} catch (error) {
				alert("Error creating room, please try again.");
				console.error("Error creating room:", error);
				window.location.reload();
			}
		}
		setInRoom(true);
	}
	function formatMessage(message: SocketMessage, index: number): JSX.Element {
		if (message.data.isSystemMessage) {
			return (
				<div
					key={index}
					className="text-gray-500 text-lg italic mb-2 justify-center flex"
				>
					{message.data.userNickname + " " + message.data.body}
				</div>
			);
		}
		const isCurrentUser =
			message.data.userIcon === emoji &&
			message.data.userNickname === name;
		const prevuser =
			index > 0 &&
			messages[index - 1].data.userIcon === message.data.userIcon &&
			messages[index - 1].data.userNickname ===
				message.data.userNickname &&
			messages[index - 1].data.isSystemMessage === false;
		return (
			<div
				key={index}
				className={`flex items-center mb-2 ${
					isCurrentUser ? "justify-end" : "justify-start"
				}`}
			>
				<span className=" text-wrap max-w-1/2">
					{!(isCurrentUser || prevuser) ? (
						<span className="text-gray-500 text-2xl font-semibold">
							{message.data.userIcon} {message.data.userNickname}
							<br />
						</span>
					) : null}
					<span
						className={`inline-flex justify-center px-3 py-1 rounded-xl text-lg font-semibold ${
							isCurrentUser
								? "bg-blue-500 text-white text-allign-right items-end"
								: "bg-gray-700 text-gray-300 text-allign-left items-start"
						}`}
					>
						{message.data.body}
					</span>
				</span>
			</div>
		);
	}
	return (
		<div
			className={`bg-gray-900 rounded-lg shadow-lg p-6 min-h-fit min-w-[400px] flex flex-col items-center transition-all duration-600 ease-in ${
				inRoom ? "w-5/12 h-5/6" : "w-1/3 h-1/2"
			}`}
		>
			{!client ? (
				"Loading..."
			) : !inRoom ? (
				<>
					<h1 className="text-white text-2xl font-bold mb-4">
						Welcome to TeleChat
					</h1>
					<p className="text-gray-400">
						A demo for Teleparty Websocket library <br />
						You can create or join a room to chat!
					</p>
					<div className="mt-4 space-y-4">
						<input
							type="text"
							placeholder="Enter your nickname"
							autoComplete="on"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
						/>
						<div>
							<label className="text-white mb-2 block">
								Choose an emoji:
							</label>
							<div className="grid grid-cols-5 gap-2">
								{emojis.map((emojiOption) => (
									<button
										key={emojiOption}
										onClick={() => setEmoji(emojiOption)}
										className={`hover:brightness-110 p-2 rounded text-2xl ${
											emoji === emojiOption
												? "bg-purple-500 "
												: "bg-gray-700"
										}`}
										type="button"
										aria-label={`Select emoji ${emojiOption}`}
									>
										{emojiOption}
									</button>
								))}
							</div>
						</div>
						<button
							onClick={() => enterRoom()}
							className="w-full bg-red-500 hover:brightness-110 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
						>
							Create Room
						</button>
						<input
							type="text"
							placeholder="Enter room code if you have one"
							value={roomId}
							onChange={(e) => setRoomId(e.target.value)}
							className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
						/>
						<button
							onClick={() => enterRoom(roomId)}
							className="w-full bg-purple-500 hover:brightness-110 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
						>
							Join Room
						</button>
					</div>
				</>
			) : (
				<>
					<h1 className="text-white text-2xl font-bold mb-4">
						Room Code: {roomId}
					</h1>
					<p className="text-gray-400 mb-4">
						Share this with your friends if you want them to join!
					</p>
					<div className="w-full flex-1 overflow-y-auto bg-gray-800 p-4 rounded mb-4">
						{messages.map((msg, index) =>
							formatMessage(msg, index)
						)}
					</div>
					<div className="w-full flex gap-2">
						<input
							type="text"
							placeholder="Type your message..."
							className="flex-1 p-2 mb-2 bg-gray-800 text-white rounded"
							id="messageInput"
							autoComplete="off"
							value={messageText}
							onChange={(e) => setMessageText(e.target.value)}
							onFocus={() => {
								client?.sendMessage(
									SocketMessageTypes.SET_TYPING_PRESENCE,
									{
										typing: true,
									}
								);
							}}
							onBlur={() => {
								client?.sendMessage(
									SocketMessageTypes.SET_TYPING_PRESENCE,
									{
										typing: false,
									}
								);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									if (messageText.trim()) {
										client?.sendMessage(
											SocketMessageTypes.SEND_MESSAGE,
											{ body: messageText }
										);
										setMessageText("");
									}
								}
							}}
						/>
						<button
							className="bg-purple-500 hover:brightness-110 text-white px-4 py-2 rounded mb-2"
							onClick={() => {
								if (messageText.trim()) {
									client?.sendMessage(
										SocketMessageTypes.SEND_MESSAGE,
										{ body: messageText }
									);
									setMessageText("");
									document
										.getElementById("messageInput")
										?.focus();
								}
							}}
						>
							Send
						</button>
					</div>
				</>
			)}
		</div>
	);
};

export default ChatApp;
