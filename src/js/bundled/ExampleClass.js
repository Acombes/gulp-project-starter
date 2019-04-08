class ExampleClass {
  constructor (str) {
    ExampleClass.print(str)
  }

  static print (str) {
    console.log('ExampleClass: ', str) // eslint-disable-line
  }
}

module.exports = ExampleClass
