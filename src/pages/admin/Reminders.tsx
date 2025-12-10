<button
                        onClick={() => toggleReminderDetails(reminder.appointment.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        {showDetails[reminder.appointment.id] ? 
                          <EyeOff className="h-5 w-5" /> : 
                          <Eye className="h-5 w-5" />
                        }
                      </button>