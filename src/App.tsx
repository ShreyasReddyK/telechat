import "./App.css";
import ChatApp from "./ChatApp";

function App() {
	return (
		<div className="bg-gradient-to-br from-red-600 to-purple-600 text-white p-6 h-screen justify-center flex items-center">
			<ChatApp />
			<p className="text-purple-300 fixed bottom-1 right-1 select-none">
				By Shreyas for Teleparty.
			</p>
		</div>
	);
}

export default App;
