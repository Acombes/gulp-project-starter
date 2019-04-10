const nunjucks = require('nunjucks')

class NunjucksSvgUse {
  constructor (spriteClass = 'svg-sprite', spriteUrl) {
    this.tags = [ 'svg' ]
    this.class = spriteClass
    this.url = spriteUrl
  }

  parse (parser, nodes) {
    const tag = parser.nextToken()
    const args = parser.parseSignature(null, true)

    parser.advanceAfterBlockEnd(tag.value)

    return new nodes.CallExtension(this, 'run', args)
  }

  run (context, ...args) {
    return new nunjucks.runtime.SafeString(
      args.map(picto => `<svg class="${this.class} ${this.class}--${picto}"><use xlink:href="${this.url}#${picto}"></use></svg>`)
        .join('')
    )
  }
}

module.exports = NunjucksSvgUse
