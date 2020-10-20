var ENTER_KEY = 13;
var TAB_KEY = 9;
var ESCAPE_KEY = 27;

var util = {
  uuid: function () {               
    var i, random;
    var uuid = '';

    for (i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0;
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += '-';
      }
      uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
    }

    return uuid;
  }
};

var todos = [];

document.getElementById('new-todo').addEventListener('keyup', create);
document.addEventListener('click', clickCheck);
document.getElementById('todo-list').addEventListener('keyup', function (event){
      if (event.target.className === 'edit'){
        editKeyup(event);
      }
    });
document.getElementById('todo-list').addEventListener('focusout', function(event){
  if (event.target.className === 'edit'){
    update(event);
  }
});
document.getElementById('todo-list').addEventListener('change', function(event){
  if (event.target.className === 'toggle'){
    toggle(event);
  }
});

var todoListUl = document.getElementById('todo-list');

var pendingClick = 0;

function clickCheck(e) {
  // kill any pending single clicks
  if (pendingClick) {
      clearTimeout(pendingClick);
      pendingClick = 0;
  }
  switch (e.detail) {

      case 1:
          pendingClick = setTimeout(function() {      
            console.log(e);                            
              if(e.shiftKey){
                createNest(e);
              } else if(e.altKey){
                unNest(e);
              }
          }, 200);
          break;
      case 2:
          edit(e);
          break;
      default:
          break;
  }
};
 
function render()  {
  document.getElementById('todo-list').innerHTML = createHTML(todos, todoListUl).innerHTML;
  document.getElementById('new-todo').focus();
  if (todos.length > 0) {
    console.log(todos.length);
  }
};

function create(e) {
  var input = e.target;
  var val = input.value.trim();
  if(e.which != ENTER_KEY && e.which != TAB_KEY || !val) {
    return;
  }

  if(e.which === ENTER_KEY) {
    todos.push({
      title: val,
      subTodos: [],
      id: util.uuid(), 
      completed: false
    });

    input.value = '';
    render();
  };
};
  
function createNest(e) {
  var todoToNest = e.target.closest('li').getAttribute('data-id'); 
  var nestLi = e.target.closest('li').previousElementSibling.getAttribute('data-id');
  
  function getSubTodoObj(array, dataid) {
    for(var i = 0; i < array.length; i++) { 
      var todo = array[i];      
      if(todo.id === dataid) {
        var foundTodo = todo;
        array.splice(i, 1);
      } else if (todo.subTodos.length > 0) {
          var foundTodo = getSubTodoObj(todo.subTodos, dataid);            
        }
      } 
    return foundTodo;
    };

  var subTodo = getSubTodoObj(todos, todoToNest);

  function nestSubTodo(array) {
    for(var i = 0; i < array.length; i++) {
      if(array[i].id === nestLi) {
        array[i].subTodos.push(subTodo);
      } else if(array[i].subTodos.length > 0) {
          nestSubTodo(array[i].subTodos);
      }
    }
  };

  nestSubTodo(todos);
  render();
};

function unNest(e) {
  var nestLi = e.target.closest('li').parentElement.parentElement.getAttribute('data-id');
  var todoToUnNest = e.target.closest('li').getAttribute('data-id');

  function checkTodoInSubTodos(array, dataid) {
    for(var i = 0; i < array.length; i++) {       
      if(array[i].id === dataid) {
        return;
      } else if (array[i].subTodos.length > 0) {
          removeSubTodo(array[i].subTodos, dataid);            
        }
      } 
    return;
   };

  function removeSubTodo(array, dataid) {
    for(var i = 0; i < array.length; i++) {
      if(array[i].id === dataid) {
        todoMatch = array[i];
        array.splice(i, 1);
      } else if(array[i].subTodos.length > 0) {
        removeSubTodo(array[i].subTodos, dataid);
      }
    } 
    return todoMatch;
  }
 
  function addTodoBack(array, dataid, todoMatch) {
    for(var i = 0; i < array.length; i++) {
      if(array[i].id === dataid) {
        return array.splice(i + 1, 0, todoMatch);
      } else if(array[i].subTodos.length > 0) {
        addTodoBack(array[i].subTodos, dataid, todoMatch);
      }
    }
  };
  
  checkTodoInSubTodos(todos, todoToUnNest);
  addTodoBack(todos, nestLi, todoMatch);
  render();
};

function toggle(e){
  var li = e.target.closest('li').getAttribute('data-id');
  toggleCompleted(todos, li);


  function toggleCompleted(array, dataid) {
    for(var i = 0; i < array.length; i++) {
      if(array[i].id === dataid) {
        array[i].completed = !array[i].completed;
        var toggleBox = array[i].completed;
        if(array[i].subTodos.length > 0) {
          toggleSubTodos(array[i].subTodos, toggleBox)
        } 
      } else if(array[i].subTodos.length > 0) {
        toggleCompleted(array[i].subTodos, dataid);
      }
    }
  };

  function toggleSubTodos(array, toggleStatus) {
    array.forEach(function(subTodo) {
      subTodo.completed = toggleStatus;
      if(subTodo.subTodos.length > 0) {
        toggleSubTodos(subTodo.subTodos, toggleStatus)
      }
    })
  };

  render();
};
 
function edit(e) {
  var li = e.target.closest('li');
  var input = e.target.closest('li').firstElementChild.nextSibling;
  var divClass = e.target.closest('li').firstElementChild

  divClass.style.display = 'none';
  input.style.display = 'block';
  input.focus();

  var val = input.value;
  input.value = '';
  input.value = val;
  };

function editKeyup(e) {
  if (e.which === ENTER_KEY) {
    e.target.blur();
  }

  if (e.which === ESCAPE_KEY) {
    e.target.dataset.abort = true;
    e.target.blur();
  }
};

function update(e) {
  var el = e.target;
  var li = e.target.closest('li').getAttribute('data-id');
  var val = el.value.trim();

  editTodoObj(todos, li);

  function editTodoObj(array, dataid) {
    if (!val) {
      deleteObj(todos, li);
      return;
    } else {
      for(var i = 0; i < array.length; i++) {       
        if(array[i].id === dataid) {
          var todoToEdit = array[i].title = val;
          return todoToEdit;
        } else if (array[i].subTodos.length > 0) {
            var todoToEdit = editTodoObj(array[i].subTodos, dataid);            
        }
      } 
      return todoToEdit;
    }
  };

  render();
};

function deleteObj(array, dataid) {
  for(var i = 0; i < array.length; i++) {       
      if(array[i].id === dataid) {
        array.splice(i, 1);
        return;
      } else if (array[i].subTodos.length > 0) {
          var todoToEdit = deleteObj(array[i].subTodos, dataid); 
          return;           
      }
  } 
  return;
};


function createHTML(array, startLi) {
  var ul = document.getElementById('todo-list');
  ul.innerHTML = '';
    
  if(startLi.querySelector('ul') === null) {
      var ul = document.createElement('ul');
      ul.innerHTML = '';
    } 

    for(var i = 0; i < array.length; i++) {
      var li = document.createElement('li');
      var div = document.createElement('div');
      div.classList.add('view');

      li.dataset.id = array[i].id;

      var addToggle = document.createElement('input');
      addToggle.classList.add('toggle');
      addToggle.setAttribute('type', 'checkbox');
      if (array[i].completed){
        addToggle.setAttribute('checked', true);
      }

      var addLabel = document.createElement('label');
      addLabel.innerHTML = array[i].title;

      var addEdit = document.createElement('input');
      addEdit.style.display = 'none';
      addEdit.classList.add('edit');
      addEdit.setAttribute('value', array[i].title);

      li.appendChild(div);
      li.appendChild(addEdit);
      div.appendChild(addToggle);
      div.appendChild(addLabel);

      ul.appendChild(li);
      startLi.appendChild(ul);

      if(array[i].subTodos.length >0) {
        createHTML(array[i].subTodos, li)
      }
    } return ul;
};
