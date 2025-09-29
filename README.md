# StudyEZ Quiz Platform

A TypeScript-based web application for creating and taking interactive quizzes using XML-formatted question files.

## Features

- **Interactive Quiz Interface**: Clean, modern UI for taking quizzes
- **XML-based Quiz Format**: Easy-to-create quiz files in XML format
- **Multiple Difficulty Levels**: Support for easy, medium, and hard quizzes
- **Passing Scores**: Configurable passing scores for each quiz
- **Time Limits**: Optional time limits for quizzes
- **Detailed Results**: Comprehensive results showing correct/incorrect answers with explanations
- **Responsive Design**: Works on desktop and mobile devices
- **Progress Tracking**: Real-time progress indicators during quizzes

## Project Structure

```
src/
├── index.html          # Main HTML template
├── index.ts           # Main application entry point
├── styles.css         # Application styles
├── types.ts          # TypeScript type definitions
├── xmlParser.ts      # XML quiz parser utility
├── quizManager.ts    # Quiz state management
└── quizzes/          # Sample XML quiz files
    ├── typescript-advanced.xml
    └── web-development-basics.xml
```

## XML Quiz Format

Quizzes are defined in XML format with the following structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <id>unique-quiz-id</id>
    <title>Quiz Title</title>
    <description>Quiz description</description>
    <difficulty>easy|medium|hard</difficulty>
    <passingScore>70</passingScore>
    <timeLimit>15</timeLimit> <!-- Optional, in minutes -->
    <questions>
        <question>
            <id>q1</id>
            <text>Question text here?</text>
            <answers>
                <answer id="a1">Answer option 1</answer>
                <answer id="a2">Answer option 2</answer>
                <answer id="a3">Answer option 3</answer>
                <answer id="a4">Answer option 4</answer>
            </answers>
            <correctAnswer>a2</correctAnswer>
            <explanation>Optional explanation of the correct answer</explanation>
        </question>
        <!-- More questions... -->
    </questions>
</quiz>
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone or download the project files
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

Build the project:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Taking a Quiz

1. Open the application in your browser
2. Select a quiz from the available options on the home screen
3. Click on a quiz card to start
4. Answer each question by clicking on your chosen answer
5. Navigate between questions using Previous/Next buttons
6. Submit the quiz when all questions are answered
7. View your results with detailed feedback

### Creating Custom Quizzes

1. Create a new XML file in the `src/quizzes` directory
2. Follow the XML format described above
3. Add your questions with multiple choice answers
4. Specify the correct answer ID for each question
5. Set difficulty level and passing score
6. Load the quiz in your application

### Quiz Features

- **Multiple Choice Questions**: Support for 2-6 answer options per question
- **Explanations**: Optional explanations for correct answers
- **Difficulty Levels**: Visual indicators for easy, medium, and hard quizzes
- **Progress Tracking**: Visual progress bar and question counter
- **Results Analysis**: Detailed breakdown of correct/incorrect answers
- **Pass/Fail Status**: Clear indication based on passing score

## Technical Details

### Technologies Used

- **TypeScript**: Strongly typed JavaScript for better development experience
- **Webpack**: Module bundler and development server
- **CSS3**: Modern styling with flexbox and grid layouts
- **HTML5**: Semantic markup structure
- **DOM Parser**: Built-in XML parsing capabilities

### Key Classes

- **XMLQuizParser**: Parses XML quiz files into TypeScript objects
- **QuizManager**: Manages quiz state, navigation, and scoring
- **StudyEZApp**: Main application class handling UI and user interactions

### Browser Compatibility

- Modern browsers supporting ES2020
- CSS Grid and Flexbox support required
- DOM Parser API support required

## Customization

### Styling

Modify `src/styles.css` to customize the appearance:

- Color schemes
- Typography
- Layout and spacing
- Animations and transitions

### Quiz Logic

Extend the `QuizManager` class to add features like:

- Time limits with countdown
- Question randomization
- Score weighting
- Multiple attempts tracking

### Additional Question Types

The XML parser can be extended to support:

- True/False questions
- Multiple select questions
- Fill-in-the-blank questions
- Image-based questions

## Contributing

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please check the code documentation or create an issue in the project repository.
