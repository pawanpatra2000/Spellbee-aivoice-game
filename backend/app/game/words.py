"""Hardcoded word list for the Spell Bee game, organized by difficulty."""

WORD_LIST = {
    "easy": [
        {
            "word": "apple",
            "definition": "A round fruit with red or green skin and a whitish interior",
            "sentence": "She picked a ripe apple from the tree.",
        },
        {
            "word": "brave",
            "definition": "Ready to face and endure danger or pain",
            "sentence": "The brave firefighter rescued the cat from the burning building.",
        },
        {
            "word": "cloud",
            "definition": "A visible mass of water droplets suspended in the atmosphere",
            "sentence": "A dark cloud covered the sun before the storm.",
        },
        {
            "word": "dance",
            "definition": "To move rhythmically to music",
            "sentence": "They love to dance at every party they attend.",
        },
        {
            "word": "flame",
            "definition": "A hot glowing body of ignited gas",
            "sentence": "The candle flame flickered in the breeze.",
        },
        {
            "word": "grape",
            "definition": "A small round fruit growing in clusters on a vine",
            "sentence": "He added a bunch of grapes to the fruit salad.",
        },
        {
            "word": "jungle",
            "definition": "An area of land with dense tropical vegetation",
            "sentence": "The explorer ventured deep into the jungle.",
        },
        {
            "word": "planet",
            "definition": "A celestial body moving in an orbit around a star",
            "sentence": "Earth is the third planet from the sun.",
        },
    ],
    "medium": [
        {
            "word": "ancient",
            "definition": "Belonging to the very distant past",
            "sentence": "The ancient ruins attracted tourists from all over the world.",
        },
        {
            "word": "balance",
            "definition": "An even distribution of weight enabling someone to remain steady",
            "sentence": "She kept her balance while walking on the narrow beam.",
        },
        {
            "word": "cabinet",
            "definition": "A cupboard with shelves or drawers for storing items",
            "sentence": "He stored the dishes in the kitchen cabinet.",
        },
        {
            "word": "dolphin",
            "definition": "A small gregarious toothed whale with a beaklike snout",
            "sentence": "The dolphin leaped gracefully out of the water.",
        },
        {
            "word": "foreign",
            "definition": "Relating to a country other than one's own",
            "sentence": "She studied foreign languages in college.",
        },
        {
            "word": "genuine",
            "definition": "Truly what something is said to be; authentic",
            "sentence": "His apology seemed genuine and heartfelt.",
        },
        {
            "word": "horizon",
            "definition": "The line at which the earth's surface and the sky appear to meet",
            "sentence": "The sun slowly sank below the horizon.",
        },
        {
            "word": "mystery",
            "definition": "Something that is difficult or impossible to understand",
            "sentence": "The disappearance of the ship remains a mystery.",
        },
    ],
    "hard": [
        {
            "word": "necessary",
            "definition": "Required to be done; essential",
            "sentence": "It is necessary to wear a seatbelt while driving.",
        },
        {
            "word": "beautiful",
            "definition": "Pleasing the senses or mind aesthetically",
            "sentence": "The sunset over the ocean was beautiful.",
        },
        {
            "word": "knowledge",
            "definition": "Facts, information, and skills acquired through experience or education",
            "sentence": "Knowledge is the key to solving complex problems.",
        },
        {
            "word": "elephant",
            "definition": "A very large herbivorous mammal with a trunk and tusks",
            "sentence": "The elephant sprayed water with its trunk at the zoo.",
        },
        {
            "word": "recognize",
            "definition": "To identify someone or something from having encountered them before",
            "sentence": "I did not recognize her after so many years.",
        },
        {
            "word": "brilliant",
            "definition": "Exceptionally clever or talented",
            "sentence": "The scientist had a brilliant idea that changed everything.",
        },
        {
            "word": "orchestra",
            "definition": "A large group of musicians playing various instruments together",
            "sentence": "The orchestra performed a stunning symphony at the concert hall.",
        },
        {
            "word": "vegetable",
            "definition": "A plant or part of a plant used as food",
            "sentence": "Eating a vegetable with every meal is good for your health.",
        },
    ],
}


def format_word_list_for_prompt() -> str:
    """Format the word list into a readable string for the LLM system prompt."""
    lines = []
    for difficulty, words in WORD_LIST.items():
        lines.append(f"\n{difficulty.upper()} WORDS:")
        for i, entry in enumerate(words, 1):
            lines.append(
                f'  {i}. {entry["word"]} — {entry["definition"]} — "{entry["sentence"]}"'
            )
    return "\n".join(lines)
