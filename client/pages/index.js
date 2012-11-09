Template.index.hasBooksCheckedOut = function () {
    return (Books.find({}).count > 0);
    
}