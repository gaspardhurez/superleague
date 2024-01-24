window.onload = function () {

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const isInTFMode = Boolean(parseInt(urlParams.get("tf") || 0));
    const customConfig = urlParams.get("config") || null;

    // Set intial value for ddb's energy (1 energy point == 1 half heart)
    const INITIAL_DDB_ENERGY = 10;

    // Define classes to denote energy levels
    const FULL_ICON_CLASS = "full";
    const HALF_ICON_CLASS = "half";
    const EMPTY_ICON_CLASS = "empty";

    // Set rate at which ddb's energy increases
    // (in milliseconds - currently 3 minutes)
    const DDB_ENERGY_REGEN_TIME = 180000;

    // Maximum length of a message (in characters)
    const MAX_MESSAGE_LENGTH = 1000;

    const chatText = document.querySelector("#ddbChatText");
    const stopGenBtn = document.getElementById("stopGenBtn");
    const textarea = document.querySelector("#ddbInput textarea");
    const resizeHandle = document.getElementById("resizeHandle");
    const ddbIconAwake = document.getElementById("ddbIconAwake");
    const ddbIconSleeping = document.getElementById("ddbIconSleeping");
    const ddbChatText = document.getElementById("ddbChatText");
    const ddbInput = document.getElementById("ddbInput");
    const ddbTextarea = document.getElementById("ddbInputTextarea");
    const inputStyle =
        ddbInput.currentStyle || window.getComputedStyle(ddbInput);

    let marginTop;
    let startPos;
    let startHeightChat;
    let startHeightInput;
    let startHeightTextarea;

    function resize(e) {
        const y = startPos - e.clientY;
        const chatHeight = startHeightChat + marginTop - y;
        const textareaHeight = startHeightTextarea + y;
        const inputHeight = startHeightInput + y;

        // Limiting the size so that elements don't disappear completely
        if (chatHeight > 50 && inputHeight > 50) {
            ddbInput.style.height = `${inputHeight}px`;
            ddbTextarea.style.height = `${textareaHeight}px`;
            ddbTextarea.scrollTop = ddbTextarea.scrollHeight;
        }
    }

    resizeHandle.addEventListener(
        "mousedown",
        function (e) {
            startPos = e.clientY;
            startHeightChat = ddbChatText.offsetHeight;
            startHeightInput = ddbInput.offsetHeight;
            startHeightTextarea = ddbTextarea.offsetHeight;
            marginTop = parseInt(inputStyle.marginTop);
            document.addEventListener("mousemove", resize, false);
        },
        false
    );

    document.addEventListener(
        "mouseup",
        function () {
            document.removeEventListener("mousemove", resize, false);
        },
        false
    );

    const md = markdownit({
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return (
                        '<pre class="hljs"><code>' +
                        hljs.highlight(str, {
                            language: lang,
                            ignoreIllegals: true,
                        }).value +
                        "</code></pre>"
                    );
                } catch (__) {}
            }
            return (
                '<pre class="hljs"><code>' +
                md.utils.escapeHtml(str) +
                "</code></pre>"
            );
        },
    });

    let messages = [];

    function getGptResponse(id, message) {

        // Allow user to stop generating response
        const aborter = new AbortController();
        stopGenBtn.style.display = "inline-block";
        stopGenBtn.addEventListener("click", () => {
            aborter.abort();
            messages.pop(); // remove the last message
            stopGenBtn.style.display = "none";
            textarea.removeAttribute("disabled");
        });

        // Timeout for fetch
        const timeOut = setTimeout(() => {
            aborter.abort();
            messages.pop(); // Remove the last message
            stopGenBtn.style.display = "none";
            textarea.removeAttribute("disabled");
            alert(
                "Quack! I am taking too long to respond. Please try again later."
            );
        }, 10000);

        let config = "chat_cs50";
        if (isInTFMode) {
            config = "chat_cs50_tf";
        }
        if (customConfig !== null) {
            config = customConfig;
        }

        // Prepare data to send
        messages.push({ role: "user", content: message });
        const protocol = window.location.protocol;
        const host = window.location.host;
        const url = `${protocol}//${host}/api/v1/chat`;
        const data = {
            messages: messages,
            stream: true,
            config: config,
        };

        fetch(url, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token"), // If using JWT
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            signal: aborter.signal,
        })
            .then((response) => {
                clearTimeout(timeOut);
                if (!response.ok) {
                    console.log(response);
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let buffers = "";
                return reader
                    .read()
                    .then(function processText({ done, value }) {
                        if (response.status === 403) {
                            document.querySelector(`#id-${id}`).innerHTML =
                                "ddb50 left the chat.";
                            stopGenBtn.style.display = "none";
                            return;
                        }
                        if (done) {
                            messages.push({
                                role: "assistant",
                                content: buffers,
                            });
                            stopGenBtn.style.display = "none";
                            textarea.removeAttribute("disabled");
                            textarea.focus();

                            // Remove energy after complete response
                            if (!isInTFMode) {
                                setEnergy(getEnergy() - 1);
                            }
                            return;
                        }
                        chatText.scrollTop = chatText.scrollHeight;
                        value = decoder.decode(value);
                        if (!value.includes("event_thread_ts")) {
                            buffers += value;
                        }
                        document.querySelector(`#id-${id}`).innerHTML =
                            md.render(buffers);
                        return reader.read().then(processText);
                    });
            })
            .catch((error) => {
                clearTimeout(timeOut);
                console.error(error);
            });
    }

    /**
     * Gets a random message when ddb is tired
     * @param {string} id
     */
    function getTiredMessage(id) {
        const tired_messages = [
            "Quack. I'm a little tired right now... zzz...",
            "zzz... *snore*",
            "What a... wonderful... zzz... question...",
            "I will be back soon! Just taking a short nap, zzz...",
        ];
        const chosen_message_id = Math.floor(
            Math.random() * tired_messages.length
        );
        document.querySelector(`#id-${id}`).innerHTML =
            tired_messages[chosen_message_id];
        textarea.removeAttribute("disabled");
        textarea.focus();
    }

    function addMessage({ id = uuidv4(), text, fromDuck }, restore = false) {
        const message = `<div class="ddbChat ${
            fromDuck ? "ddbChat-Duck" : "ddbChat-User"
        }">
                <span class="ddbChatBorder ${
                    fromDuck ? "ddbChatBorder-Duck" : "ddbChatBorder-User"
                }"></span>
                <span class="ddbAuthorName"><b>${
                    fromDuck ? (urlParams.get("tf") ? "student" : "ddb") : "you"
                }</b></span>
                <span id="id-${id}" class="ddbChatMessage">${
            fromDuck && !restore
                ? "..."
                : md.render(text.replace(/\n/g, "  \n"))
        }</span>
            </div>`;
        const parser = new DOMParser();
        const doc = parser.parseFromString(message, "text/html");
        const chatText = document.querySelector("#ddbChatText");
        chatText.appendChild(doc.body.firstChild);
        chatText.scrollTop = chatText.scrollHeight;

        if (fromDuck && !restore) {
            if (getEnergy() > 0) {
                getGptResponse(id, text);
            } else {
                getTiredMessage(id);
            }
        }
    }

    function reply(prevMsg) {
        addMessage({ text: prevMsg, fromDuck: true });
    }

    /**
     * Renders ddb's energy icons in the DOM
     * @param {number} ddbEnergy
     */
    function renderEnergy(ddbEnergy) {
        // Validate input type
        if (typeof ddbEnergy !== "number" || isNaN(ddbEnergy)) {
            console.error("Input to renderEnergy should be a number");
            return;
        }

        // Validate input range
        const ddbEnergyIcons = document.querySelectorAll(".ddbEnergyIcon");
        if (ddbEnergy < 0 || ddbEnergy > ddbEnergyIcons.length * 2) {
            console.error(
                "Input to renderEnergy should be between 0 and 2x the number of icons"
            );
            return;
        }

        // Calculate types of icons to render
        let numFullIcons = Math.floor(ddbEnergy / 2);
        let numHalfIcons = ddbEnergy % 2;

        // Render icons
        for (let i = 0; i < ddbEnergyIcons.length; i++) {
            let ddbEnergyIconClasses = ddbEnergyIcons[i].classList;

            // Ensure first icons have only class 'full',
            if (numFullIcons > 0) {
                ddbEnergyIconClasses.add(FULL_ICON_CLASS);
                ddbEnergyIconClasses.remove(HALF_ICON_CLASS);
                ddbEnergyIconClasses.remove(EMPTY_ICON_CLASS);
                numFullIcons -= 1;
                continue;
            }

            // If half icon required, ensure icon has only class 'half'
            if (numHalfIcons > 0) {
                ddbEnergyIconClasses.remove(FULL_ICON_CLASS);
                ddbEnergyIconClasses.add(HALF_ICON_CLASS);
                ddbEnergyIconClasses.remove(EMPTY_ICON_CLASS);
                numHalfIcons -= 1;
                continue;
            }

            // Ensure other icons have only class 'empty'
            ddbEnergyIconClasses.remove(FULL_ICON_CLASS);
            ddbEnergyIconClasses.remove(HALF_ICON_CLASS);
            ddbEnergyIconClasses.add(EMPTY_ICON_CLASS);
        }

        // Change duck icon to sleeping if no energy left,
        // otherwise show the animated gif (awake)
        if (ddbEnergy === 0) {
            ddbIconSleeping.style.display = "";
            ddbIconAwake.style.display = "none";
        } else {
            ddbIconSleeping.style.display = "none";
            ddbIconAwake.style.display = "";
        }
    }

    /**
     * Increases ddbEnergy by specified amount, then renders changes
     * @param {number} increaseAmount
     */
    function increaseEnergy(increaseAmount) {
        // Validate input
        if (typeof increaseAmount !== "number" || isNaN(increaseAmount)) {
            console.error("Input to increaseEnergy should be a number");
            return;
        }

        let ddbEnergy = getEnergy();

        // Add to energy, capping at initial value
        ddbEnergy = Math.min(INITIAL_DDB_ENERGY, ddbEnergy + increaseAmount);

        // Set new value
        setEnergy(ddbEnergy);
    }

    /**
     * Gets ddbEnergy from local storage
     * (can regenerate based on elapsed time)
     * @param {tf} regen
     * @returns {number|null} ddbEnergy
     */
    function getEnergy(regen = false) {
        try {
            // Retrieve value from local storage
            let ddbEnergyObj = localStorage.getItem("ddbEnergyObj");
            if (ddbEnergyObj === null) {
                return null;
            }

            // Convert from string to JSON
            ddbEnergyObj = JSON.parse(ddbEnergyObj);
            let { ddbEnergy, time } = ddbEnergyObj;

            // Convert energy to a number
            ddbEnergy = Number(ddbEnergy);

            // Log invalid value, return null
            if (isNaN(ddbEnergy)) {
                console.error("Invalid value for ddbEnergy:", ddbEnergy);
                return null;
            }

            if (regen) {
                // Calculate amount of energy to regenerate,
                // based on elapsed time since last energy update
                const regenAmount = Math.floor(
                    (Date.now() - time) / DDB_ENERGY_REGEN_TIME
                );

                // Add back to energy, capping at initial value
                ddbEnergy = Math.min(
                    INITIAL_DDB_ENERGY,
                    ddbEnergy + regenAmount
                );
            }

            // Return energy
            return ddbEnergy;
        } catch (error) {
            console.error("Could not access localStorage:", error);
        }
    }

    /**
     * Sets ddbEnergy in local storage, renders changes
     * @param {number} ddbEnergy
     */
    function setEnergy(ddbEnergy) {
        // Save ddbEnergy and timestamp to local storage
        try {
            ddbEnergyObj = JSON.stringify({
                ddbEnergy: ddbEnergy,
                time: Date.now(),
            });
            localStorage.setItem("ddbEnergyObj", ddbEnergyObj);
        } catch (error) {
            console.error("Could not set localStorage:", error);
        }

        // Render changes via heart icons
        renderEnergy(ddbEnergy);
    }

    function uuidv4() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
            (
                c ^
                (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
            ).toString(16)
        );
    }

    try {
        // Determine if in TF mode
        if (!isInTFMode) {
            // Set energy on page load, with regen enabled
            let ddbEnergy = getEnergy((regen = true));
            if (ddbEnergy === null) {
                ddbEnergy = INITIAL_DDB_ENERGY;
            }
            setEnergy(ddbEnergy);

            // Allow one additional question every X minutes
            setInterval(() => increaseEnergy(1), DDB_ENERGY_REGEN_TIME);

            // Add disclaimer as starting message
            if (document.querySelector("#ddbChatText").children.length === 0) {
                const disclaimer =
                    "Quack. I am CS50's duck debugger (ddb), an experimental AI for [rubberducking](https://en.wikipedia.org/wiki/Rubber_duck_debugging). Quack quack. My replies might not always be accurate, so always think critically and let me know if you think that I've erred. Conversations are logged for debugging's sake. Quack quack quack.";
                addMessage(
                    { id: "disclaimer", text: disclaimer, fromDuck: true },
                    (restore = true)
                );
            }
        } else {
            setEnergy(INITIAL_DDB_ENERGY);
            document.querySelector("#ddbEnergy").innerHTML = "Training Mode";
            document.querySelector("#ddbInputTextarea").removeAttribute("placeholder");
            const instruction =
                "Welcome to the Training Mode. In this mode, you're engaging in a simulated teaching session, addressing questions posed by students. You'd bear the role of a teaching fellow for CS50, aiding students to overcome programming challenges. Remember, your goal is to help guide your students to their own solutions rather than just providing answers. Enjoying teaching!";
            addMessage(
                { id: "disclaimer", text: instruction, fromDuck: true },
                (restore = true)
            );
        }

        textarea.addEventListener("keypress", (event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.shiftKey)) {
                // Override enter key behavior if CTRL or SHIFT is pressed,
                // such that it inserts a newline instead of sending a message
                event.preventDefault();
                let textBox = event.target;
                let startPos = textBox.selectionStart;
                let endPos = textBox.selectionEnd;
                textBox.value = textBox.value.slice(0, startPos) + "\n" + textBox.value.slice(endPos);
                // set cursor to the new line
                textBox.selectionStart = startPos + 1;
                textBox.selectionEnd = startPos + 1;
            } else if (event.key === "Enter" && event.target.value) {
                event.preventDefault();

                // Do not allow messages longer than X characters
                if (event.target.value.length > MAX_MESSAGE_LENGTH) {
                    alert(
                        "Quack! Too much text for me to handle. Please try again with a shorter message."
                    );
                    return;
                }

                event.target.setAttribute("disabled", "disabled");
                userMessage = event.target.value.trim();

                // Check if userMessage is empty after trimming
                if (userMessage === "") {
                    event.target.value = "";
                    event.target.removeAttribute("disabled");
                    event.target.focus();
                    return;
                }

                event.target.value = "";
                addMessage({ text: userMessage });
                setTimeout(() => {
                    reply(userMessage);
                }, 500 * Math.random() + 500);
            }
        });
        textarea.focus();

        const sendBtn = document.getElementById("sendBtn");
        sendBtn.addEventListener("click", () => {
            if (textarea.value) {
                userMessage = textarea.value;
                textarea.value = "";
                textarea.setAttribute("disabled", "disabled");
                addMessage({ text: userMessage });
                setTimeout(() => {
                    reply(userMessage);
                }, 500 * Math.random() + 500);
            }
        });
    } catch (error) {
        console.log(error);
    }
};
