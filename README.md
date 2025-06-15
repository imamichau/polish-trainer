# polish-trainer
A web-based application designed to help users practice and improve their Polish language skills through interactive exercises and quizzes.

### **Start application**:
* `npx http-server .`
* `npx http-server . -p 3000`
* Create `launch.json` file and put the following configuration:
    ```json
    {
        "version": "0.2.0",
        "configurations": [
            {
            "type": "node",
            "request": "launch",
            "name": "Run npx http-server",
            "runtimeExecutable": "npx",
            "runtimeArgs": ["http-server", "."],
            "restart": true,
            "console": "integratedTerminal",
            "internalConsoleOptions": "neverOpen"
            }
        ]
    }
    ```

### **Words dictionary**:
please populate `words.json` file with the words you want to practice.

#### Format of dictionary file:
```json
[
  {
    "pl": "pies",
    "ru": "собака",
    "transcription": "[пьес]",
    "image": "assets/img/dog.jpg"
  },
  {
    "pl": "kot",
    "ru": "кот",
    "transcription": "[кот]",
    "image": "assets/img/cat.jpg"
  },
  {
    "pl": "dom",
    "ru": "дом",
    "transcription": "[дом]",
    "image": "assets/img/house.jpg"
  },
  {
    "pl": "jabłko",
    "ru": "яблоко",
    "transcription": "[яблко]",
    "image": "assets/img/apple.jpg"
  }
]
```