require('dotenv').config()
const cors = require('cors')
const express = require('express')
const morgan = require('morgan')
const Person = require('./models/person')
const app = express()

app.use(express.static('build'))
app.use(express.json())
app.use(cors())
app.use(
  morgan((tokens, req, res) => {
    morgan.token('req-body', function (req, res) {
      return JSON.stringify(req.body)
    })
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'),
      '-',
      tokens['response-time'](req, res),
      'ms',
      tokens['req-body'](req, res),
    ].join(' ')
  })
)

app.get('/info', async (req, res) => {
  try {
    const persons = await Person.find({})
    const info = `<p>Phonebook has info for ${
      persons.length
    } people</p><p>${new Date()}</p>`
    res.send(info)
  } catch (e) {
    console.log('Error ', e)
  }
})

app.get('/api/persons', async (req, res) => {
  try {
    const persons = await Person.find({})
    res.json(persons)
  } catch (e) {
    console.log('Error ', e)
  }
})

app.get('/api/persons/:id', async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id)
    if (person) res.json(person)
    else res.status(404).end()
  } catch (e) {
    next(e)
  }
})

app.delete('/api/persons/:id', async (req, res, next) => {
  try {
    const person = await Person.findByIdAndDelete(req.params.id)
    if (person) {
      res.status(204).end()
    }
  } catch (error) {
    next(error)
  }
})

app.post('/api/persons', async (req, res, next) => {
  const body = req.body
  try {
    if (!body.name) throw new Error('NameMissing')
    if (!body.number) throw new Error('PhoneMissing')

    const person = new Person({
      name: body.name,
      number: body.number,
    })

    const savedPerson = await person.save()
    res.json(savedPerson)
  } catch (error) {
    next(error)
  }
})

app.put('/api/persons/:id', async (req, res, next) => {
  try {
    const body = req.body
    const person = {
      name: body.name,
      number: body.number,
    }
    const updatedPerson = await Person.findByIdAndUpdate(
      req.params.id,
      person,
      { new: true, runValidators: true, context: 'query' }
    )
    res.json(updatedPerson)
  } catch (error) {
    next(error)
  }
})

const errorHandler = (error, request, response, next) => {
  console.log('Error handler')
  console.log(error.name)
  console.log(error.message)
  if (error.name === 'CastError') {
    return response.status(400).json({ error: 'malformatted id' })
  }
  if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  if (error.name === 'NameMissing')
    return response.status(500).json({ error: error.message })
  if (error.name === 'PhoneMissing')
    return response.status(500).json({ error: error.message })

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT

app.listen(PORT, () => {
  console.log(`Server running at ${PORT} port`)
})
