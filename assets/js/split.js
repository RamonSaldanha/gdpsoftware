var sizes = localStorage.getItem('split-sizes')

var maxSize = 30;
var rest = (100 - maxSize);
if (sizes) {
    sizes = JSON.parse(sizes)
} else {
    sizes = [75, 25] // default sizes
}

var split = Split(['#files', '#right'], {
    sizes: sizes,
    cursor: 'e-resize',
    onDrag: function(sizes) {
        if(sizes[1] > maxSize) {
            split.setSizes([rest, maxSize])
        }
    },
    onDragEnd: function(sizes) {
        localStorage.setItem('split-sizes', JSON.stringify(sizes))
    },
})