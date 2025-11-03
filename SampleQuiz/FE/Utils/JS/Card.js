// Reference: https://forfrontend.com/flip-card-in-html-and-css/
// I didn't include .Front.
// Will need to manually do `transform: rotateY(180deg)` for more flexibility.
// Also need a container for the size and position.
function FlipCardToBack(card) {
    card.style.transform = "rotateY(180deg)";
}

function FlipCardToFront(card) {
    card.style.transform = "rotateY(0deg)";
}

class Card {
    #_parent = null;
    #_card = null;
    #_frontFace = null;
    #_backFace = null;
    #_isFrontUp = true;

    constructor(parent, isFrontUp=true) {
        this.#_parent = parent;
        this.#_card = this.#_parent.querySelector(".Card");
        this.#_frontFace = this.#_card.querySelector(".Card-face:not(.Back)");
        this.#_backFace = this.#_card.querySelector(".Card-face.Back");

        // Ensure card status:
        if (isFrontUp == true) {
            this.FlipFrontUp();
        }
        else {
            this.FlipFrontDown();
        }
    }

    get Parent() {
        return this.#_parent;
    }

    get Card() {
        return this.#_card;
    }

    get FrontFace() {
        return this.#_frontFace;
    }

    get BackFace() {
        return this.#_backFace;
    }

    get UpFace() {
        if (this.#_isFrontUp) {
            return this.#_frontFace;
        }
        else {
            return this.#_backFace;
        }
    }

    get DownFace() {
        if (this.#_isFrontUp) {
            return this.#_backFace;
        }
        else {
            return this.#_frontFace;
        }
    }

    get ID() {
        return this.#_parent.id;
    }

    get IsFrontUp() {
        return this.#_isFrontUp;
    }

    FlipFrontUp() {
        FlipCardToFront(this.#_card);
        this.#_isFrontUp = true;
    }

    FlipFrontDown() {
        FlipCardToBack(this.#_card);
        this.#_isFrontUp = false;
    }

    Flip() {
        if (this.#_isFrontUp) {
            this.FlipFrontDown();
        }
        else {
            this.FlipFrontUp();
        }
    }
}

export default Card;
export {
    FlipCardToBack,
    FlipCardToFront,
    Card
};