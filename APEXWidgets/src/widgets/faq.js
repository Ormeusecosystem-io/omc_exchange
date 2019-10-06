import React from 'react';
import Row from './faqRow';

class Faq extends React.Component {

    state = {
        questions: [
            {
                q: "What is Bitcoin?",
                a: ["Bitcoin (BTC) is the first digital currency to emerge in the crypto industry. It is based on a proof of work (PoW) consensus mechanism, which is distributed and decentralized (i.e. not controlled by a single entity like a central bank). It is open, immutable, neutral, censorship-resistant and borderless. BTC can be sent to anyone with a Bitcoin address while doing away with third parties."]
            },
            {
                q: "How can I begin trading?",
                a: ["Register on ORME.io", "Go to the deposit section and choose the digital currency you’d like to deposit, then send funds to the displayed wallet address", "Select the relevant market", "Enter your order type, the amount of cryptocurrency you’d like to buy or sell and send your order.", "*You can purchase digital currencies on ORME using our ‘Buy crypto with credit card’ option."]
            },
            {
                q: "How can ensure my account is always secure?",
                a: ["Password\nMake sure to choose a strong and unique password with multiple characters (e.g. lower case and upper case letters, symbols, numbers, etc). It is best to not use your name, birthday, mobile phone number, or any other personal identifiers that are easy to guess. The password you choose should ideally not be used on any other platform.", "Two-factor authentication\nEnable two-factor authentication (2FA), so that any time you log in to your account you will be prompted to verify it through another medium, such as a text message or phone call.", "Beware of phishing scams\nScams come in many forms, but are all designed to get ahold of your money. Fraudsters can accomplish this by getting you to reveal your personal details, stealing your information, or convincing you to willingly hand over your funds."]
            },
            {
                q: "How can I make a purchase with my credit card?",
                a: ["Register for an account and complete the verification process", "Click over to the ‘Buy crypto with credit card’ section", "Select the cryptocurrency you’d like to purchase", "Select the currency you’re paying with", "Enter the amount", "Confirm the order information", "Fill in your credit card details", "Press ‘submit’", "The order will be processed instantly, and the purchased cryptocurrency will be updated to your account balance.", "The order will be processed instantly, and the purchased cryptocurrency will be updated to your account balance."]
            },
            {
                q: "Will my deposit address ever be the same as someone else’s?",
                a: ["Your address will always be unique to you, and no other user will have the same one. Before sending any transaction, be sure to confirm that your address is correct."]
            },
            {
                q: "How long does it take to process deposits and withdrawals?",
                a: ["Deposits are processed automatically on ORME, and withdrawal requests must be confirmed via email. Bitcoin transaction confirmations typically take a few hours, while ERC-20 requests normally take a couple of minutes to an hour. Processing time is dependent on network congestion."]
            },
            {
                q: "Are currency prices locked when making deposits on the purchase page?",
                a: ["Displayed currency amounts represent approximations based on the most recent cryptocurrency prices. As such, prices are not locked when submitting a purchase request, and orders will be reflective of market prices."]
            },
            {
                q: "How can I withdraw Bitcoin?",
                a: ["Before making a withdrawal request, you must verify your account.", "Select ‘Withdrawal’ in the main menu", "Select your preferred cryptocurrency from the side menu", "Enter the withdrawal address, amount of cryptocurrency you’d like to withdraw and then select ‘Withdraw’", "Confirm your withdrawal request via email", "Make sure to confirm the details of the recipient’s address, as transactions cannot be reversed."]
            },
            {
                q: "Who pays withdrawal fees?",
                a: ["All withdrawal requests incur a fee commensurate with your total withdrawal amount."]
            },
            {
                q: "What are takers and makers?",
                a: ["Taker:\nBecause market orders do not go to the order book, they are considered ‘takers’. This is due to the fact that such trades are taking volume off of the order book.", "Maker:\nCompared to takers, makers add volume to the order book and ‘make the market’."]
            }
        ]
    }

    render() {
        return ( 
            <div id="faq">
                <div className="container">
                    <h1>FAQ</h1>
                    {
                        this.state.questions.map((question, idx) => <Row key={idx} q={question.q} a={question.a}/>)
                    }
                </div>
            </div>
       )
    }
}



export default Faq;