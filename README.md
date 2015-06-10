
# Proposed Split of the HTML specification

This project provides a tool that makes it easy to propose splits of the HTML specification; it also
makes its own (highly debatable) proposal for a split (http://darobin.github.io/breakup/specs/).

## How This Works

This uses a local copy of the W3C HTML 5.1 specification. (Being local it may be a little bit out of
date, but that shouldn't be a concern here, it can also be trivially updated.) It has a small and
simple JSON file (`split.json`) that specifies how to split the spec, which is output to the
`specs` directory along with a convenient index file.

The syntax of the JSON file is straightforward. The `delete` field is just an array of sections IDs
that can be dropped on the floor. The `split` field is an object describing each split 
specification.

In the `split` object, the key is the short name for that specification (used for the directory name 
here), the value is more intricate:

* `title`: the title of the split specification.
* `abstract`: the abstract of the split specification, most of these haven't been well specified at
  this point.
* `content`: an array of which sections to move over. For each item, either it is a string and 
  that's just the section to move over; or it's an object with `unwrap` set to `true` in which case
  the *sub*sections of the section with the given `id` are moved over; or, finally, it has
  `noSubSections` set to true in which case for section with the given `id` only the content that is
  *not* a subsection is moved over, into a new section with the provided `title`.

This may sound a little convoluted, but if you read the file and look at the split you'll get it
easily.

## Making Your Own Split

You can build your own split. One way of doing it is to just fork this repo and do whatever you want
with it. Another option, which might allow for comparisons, is to create your own JSON file 
following the syntax above and output that to another directory here.

That's pretty easy, just clone this repo and then:

    npm install -d
    node splitter -c your.json -o your_output_dir

And you're done!

## The Proposed Split

The proposed split is really just a way to get conversation going. I have a well-documented 
preference for smaller specs, I've kept it moderately in check but it's still a lot of pieces.

The output is not perfect; if this moves ahead some further clean up would be required. Most notably
this would include making WebIDL and references work properly (which can be automated) and some
tinkering with wording and styling.

The goal is to give a feel for how a split could work; not to produce perfect, shippable output.

Go [read it](http://darobin.github.io/breakup/specs/), file issues, have fun!
