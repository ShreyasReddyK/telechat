import { useEffect, useRef, useState, type JSX } from "react";
import {
	TelepartyClient,
	type SocketEventHandler,
	SocketMessageTypes,
	type SessionChatMessage,
} from "teleparty-websocket-lib";
import type { SocketMessage } from "teleparty-websocket-lib/lib/SocketMessage";

const ChatApp = () => {
	const [client, setClient] = useState<TelepartyClient | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [name, setName] = useState("");
	const [emoji, setEmoji] = useState("😎");
	const [roomId, setRoomId] = useState<string>("");
	const [messages, setMessages] = useState<SessionChatMessage[]>([]);
	const [inRoom, setInRoom] = useState<boolean>(false);
	const [areTyping, setAreTyping] = useState<string[]>([]);
	const [userList, setUserList] = useState<any[]>([]);
	const [messageText, setMessageText] = useState("");
	const [copied, setCopied] = useState(false);
	const userListRef = useRef<any[]>([]);
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
		userListRef.current = userList;
	}, [userList]);

	//handle session
	useEffect(() => {
		if (roomId.length < 16) {
			return;
		}
		const sessionData = {
			roomId,
			userSettings: { userNickname: name, userIcon: emoji },
		};
		sessionStorage.setItem("chatSession", JSON.stringify(sessionData));
	}, [roomId, name, emoji]);
	//handle session on load
	useEffect(() => {
		if (!client) return;

		setIsLoading(true);
		sessionHandler().then(() => {
			setIsLoading(false);
		});
	}, [client]);

	async function sessionHandler() {
		const session = sessionStorage.getItem("chatSession");
		const staleSession = sessionStorage.getItem("staleSession");
		const stale = staleSession ? JSON.parse(staleSession) : false;
		if (session) {
			const { roomId, userSettings } = JSON.parse(session);

			setName(userSettings.userNickname);
			setEmoji(userSettings.userIcon);

			if (!stale) {
				await joinRoom(
					roomId,
					userSettings.userNickname,
					userSettings.userIcon
				);
				setRoomId(roomId);
				return true;
			}
		}
		return false;
	}
	//setup client and handle messages
	useEffect(() => {
		const eventHandler: SocketEventHandler = {
			onConnectionReady: () => {},
			onClose: () => {
				client?.teardown();
				window.location.reload();
			},
			onMessage: (message) => {
				handleMessage(message);
			},
		};
		const client = new TelepartyClient(eventHandler);
		setClient(client);

		function handleMessage(message: SocketMessage) {
			if (message.type === "userId") {
				//setUserId(message.data.userId);
			} else if (message.type === SocketMessageTypes.SEND_MESSAGE) {
				setMessages((prevMessages) => [...prevMessages, message.data]);
			} else if (message.type === "userList") {
				const list = JSON.parse(JSON.stringify(message.data));
				setUserList(list);
			} else if (
				message.type === SocketMessageTypes.SET_TYPING_PRESENCE
			) {
				handleTyping(message.data);
			}
		}
	}, []);

	async function createRoom() {
		setMessages([]);
		if (!client) {
			return;
		}
		if (name === "") {
			alert("You must enter a nickname to join a room.");
			return;
		}

		try {
			const createdRoomId = await client.createChatRoom(name, emoji);
			setRoomId(createdRoomId);
		} catch (error) {
			alert("Error creating room, please try again.");
			window.location.reload();
		}
		sessionStorage.setItem("staleSession", JSON.stringify(false));
		setInRoom(true);
	}
	async function joinRoom(room: string, name: string, emoji: string) {
		await new Promise((resolve) => {
			setTimeout(resolve, 2000);
		});
		if (!client) {
			return;
		}
		if (name === "") {
			alert("You must enter a nickname to join a room.");
			return;
		}

		await client
			.joinChatRoom(name, room, emoji)
			.then((messageList) => {
				setMessages(messageList.messages);
				sessionStorage.setItem("staleSession", JSON.stringify(false));
				setInRoom(true);
			})
			.catch(() => {
				alert(
					"Error joining room, please check the room code and try again."
				);
			});
	}
	function leaveRoom() {
		sessionStorage.setItem("staleSession", JSON.stringify(true));
		setInRoom(false);
		setMessages([]);
		client?.teardown();
	}
	function formatMessage(
		message: SessionChatMessage,
		index: number
	): JSX.Element {
		if (message.isSystemMessage) {
			return (
				<div
					key={index}
					className="text-gray-500 text-lg italic mb-2 justify-center flex"
				>
					{message.userNickname + " " + message.body}
				</div>
			);
		}
		const isCurrentUser =
			message.userIcon === emoji && message.userNickname === name;
		const prevUser =
			index > 0 &&
			messages[index - 1].userIcon === message.userIcon &&
			messages[index - 1].userNickname === message.userNickname &&
			messages[index - 1].isSystemMessage === false;
		return (
			<div
				key={index}
				className={`flex items-center mb-2 ${
					isCurrentUser ? "justify-end" : "justify-start"
				}`}
			>
				<span className=" text-wrap max-w-1/2">
					{!prevUser ? (
						<span className="text-gray-500 text-2xl font-semibold">
							{message.userIcon} {message.userNickname}
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
						{message.body}
					</span>
				</span>
			</div>
		);
	}

	function setTyping(typing: boolean) {
		if (!client) return;
		client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, {
			typing,
		});
	}
	function handleTyping({
		anyoneTyping,
		usersTyping,
	}: {
		anyoneTyping: boolean;
		usersTyping: string[];
	}) {
		if (!anyoneTyping) {
			setAreTyping([]);
			return;
		}

		const typingUsers = userListRef.current
			.filter((user) => usersTyping.includes(user.socketConnectionId))
			.map((user) => user.userSettings.userNickname);

		setAreTyping(typingUsers);
	}
	function handleCopy() {
		navigator.clipboard
			.writeText(roomId)
			.then(() => {
				setCopied(true);
				setTimeout(() => {
					setCopied(false);
				}, 1500);
			})
			.catch(() => {
				alert("Failed to copy room code.");
				//probably will never happen, but I'm not leaving it uncaught
			});
	}
	return (
		<div
			className={`bg-gray-900 rounded-lg shadow-lg p-6 min-h-fit min-w-[400px] flex flex-col items-center transition-all duration-600 ease-in ${
				inRoom && !isLoading ? "w-5/12 h-5/6" : "w-1/3 h-1/2"
			}`}
		>
			{!client || isLoading ? (
				<div className="flex items-center justify-center h-full text-purple-400 text-2xl animate-pulse ">
					Loading...
				</div>
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
							className="w-full p-2 mb-2 bg-gray-800 text-white rounded focus-within:outline-purple-400 focus:outline-1"
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
										className={`p-2 rounded text-2xl hover:brightness-110 ${
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
							onClick={() => createRoom()}
							className="w-full bg-purple-500 hover:brightness-110 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
						>
							Create Room
						</button>
						<input
							type="text"
							placeholder="Enter room code if you have one"
							value={roomId}
							onChange={(e) => setRoomId(e.target.value)}
							className="w-full p-2 mb-2 bg-gray-800 text-white rounded focus-within:outline-purple-400 focus:outline-1"
						/>
						<button
							disabled={
								roomId.length !== 16 ||
								!/^[a-z0-9]+$/i.test(roomId)
							}
							onClick={async () => {
								setIsLoading(true);
								await joinRoom(roomId, name, emoji);
								setIsLoading(false);
							}}
							className={`w-full hover:brightness-90 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
								roomId.length == 16 &&
								/^[a-z0-9]+$/i.test(roomId)
									? "bg-red-500 hover:brightness-110 shadow-lg shadow-red-500/70 ring-4 ring-red-600/40 animate-pulse"
									: "bg-gray-800 cursor-not-allowed"
							}`}
						>
							Join Room
						</button>
					</div>
				</>
			) : (
				<>
					<div className="w-full flex items-center justify-center mb-4">
						<h2 className="text-white text-2xl font-bold">
							Room Code: {roomId}
						</h2>
						<button
							onClick={() => {
								handleCopy();
							}}
							className="bg-purple-500 hover:brightness-110 text-white font-bold p-3 rounded focus:outline-none focus:shadow-outline ml-3"
						>
							{copied ? (
								<svg
									className="w-3.5 h-3.5"
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 16 12"
								>
									<path
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M1 5.917 5.724 10.5 15 1.5"
									/>
								</svg>
							) : (
								<svg
									className="w-3.5 h-3.5"
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									fill="currentColor"
									viewBox="0 0 18 20"
								>
									<path d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm-3 14H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Zm0-5H5a1 1 0 0 1 0-2h2V2h4v2h2a1 1 0 1 1 0 2Z" />
								</svg>
							)}
						</button>
					</div>
					<p className="text-gray-400 mb-4">
						Share this with your friends if you want them to join!
					</p>
					<button
						className="bg-red-500 hover:brightness-90 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4"
						onClick={() => {
							leaveRoom();
						}}
					>
						Leave Room
					</button>
					<div
						className={`w-full flex-1 overflow-y-auto bg-gray-800 p-4 rounded ${
							areTyping ? "mb-1" : "mb-8"
						}`}
					>
						{messages.map((msg, index) =>
							formatMessage(msg, index)
						)}
					</div>
					<div className="mb-3 w-full bg-gray-800 justify-center flex rounded transform transition-all duration-300 ease-in-out">
						<p className="text-gray-500 italic">
							{areTyping.length === 1 &&
								`${areTyping[0]} is typing...`}
							{areTyping.length > 1 &&
								`${areTyping.join(", ")} are typing...`}
						</p>
					</div>
					<div className="w-full flex gap-2">
						<input
							type="text"
							placeholder="Type your message..."
							className="flex-1 p-2 mb-2 bg-gray-800 text-white rounded focus-within:outline-purple-400 focus:outline-1"
							id="messageInput"
							autoComplete="off"
							value={messageText}
							onChange={(e) => setMessageText(e.target.value)}
							onFocus={() => {
								setTyping(true);
							}}
							onBlur={() => {
								setTyping(false);
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
